// 检查浏览器支持（Chrome 103+、Safari 16+、Firefox Nightly）
/*if (!("highlights" in CSS)) {
  console.warn("CSS Custom Highlight API 不支持！");
  return;
}*/

/**
 * 创建并注册高亮（支持多 Range）
 * @param {Array<Range>} ranges - DOM Range 数组
 * @param {string} highlightName - 注册名，如 'search-yellow'
 */
export function registerHighlight(ranges: Range[], highlightName: string) {
  // 创建 Highlight 对象（传入多个 Range）
  const highlight = new Highlight(...ranges);

  // 注册：用 set() 而不是 register！
  CSS.highlights.set(highlightName, highlight);

  console.log(`高亮 "${highlightName}" 已注册，共 ${ranges.length} 个范围`, ranges);
}

export function queryTextNodes(node: Element) {
  const nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT, (node) =>
    /\S/.test(node.textContent || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  );
  const textNodes: Text[] = [];
  let currentNode: Node | null;
  while ((currentNode = nodeIterator.nextNode())) {
    textNodes.push(currentNode as Text);
  }
  return textNodes;
}
type NodeOffset = { node: Text; start: number; end: number };

const style = document.createElement("style");
style.innerHTML = `
  /* 黄色的搜索高亮 */
::highlight(search-yellow) {
  background-color: #ffeb3b;
  color: #000;
}

/* 红色的错误高亮 */
::highlight(error-red) {
  background-color: #ff5252;
  color: #fff;
}
  `;

// 自定义函数：搜索并高亮关键词
export function highlightKeyword(
  editor: Element,
  keyword: string,
  highlightName = "search-yellow"
) {
  clearHighlight(highlightName);
  if (!document.head.contains(style)) {
    document.head.appendChild(style);
  }
  requestAnimationFrame(() => {
    const allTextNodes = queryTextNodes(editor);
    // 1. 拼接所有文本节点内容，记录每个节点的起始全局偏移
    let fullText = "";
    const nodeOffsets: NodeOffset[] = [];
    allTextNodes.forEach((node) => {
      const start = fullText.length;
      const text = node.textContent || "";
      fullText += text;
      const end = fullText.length;
      nodeOffsets.push({ node, start, end });
    });
    // 2. 查找所有匹配关键词的位置
    const ranges: Range[] = [];
    let pos = 0;
    while ((pos = fullText.indexOf(keyword, pos)) !== -1) {
      const range = new Range();

      // 3. 根据全局偏移映射到具体文本节点和偏移
      const startInfo = findNodeAtOffset(nodeOffsets, pos);
      const endInfo = findNodeAtOffset(nodeOffsets, pos + keyword.length);

      if (startInfo && endInfo) {
        range.setStart(startInfo.node, startInfo.offset);
        range.setEnd(endInfo.node, endInfo.offset);
        ranges.push(range);
      }
      pos += keyword.length;
    }

    // 4. 注册高亮
    if (ranges.length > 0) {
      registerHighlight(ranges, highlightName);
    }
  });
}

/**
 * 根据全局文本偏移，找到对应的文本节点和节点内偏移
 * @param nodeOffsets 节点偏移数组
 * @param globalOffset 全局字符偏移
 */
function findNodeAtOffset(
  nodeOffsets: NodeOffset[],
  globalOffset: number
): { node: Text; offset: number } | null {
  for (const { node, start, end } of nodeOffsets) {
    if (globalOffset >= start && globalOffset <= end) {
      return { node, offset: globalOffset - start };
    }
  }
  return null;
}

// 清除高亮
function clearHighlight(highlightName:string) {
  if (CSS.highlights.has(highlightName)) {
    CSS.highlights.delete(highlightName);
    console.log(`高亮 "${highlightName}" 已清除`);
  }
}

// 调用
//highlightWithCSSAPI(editor, "高亮字段", "search-yellow");
