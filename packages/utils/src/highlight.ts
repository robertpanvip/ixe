type NodeOffset = {
  node: Text;
  start: number;
  end: number;
  innerText: string;
  data: string;
};

// 全局 registry： highlightName -> (ele -> Range[])
const highlightRegistry = new Map<string, Map<Element, Range[]>>();

const globalHighlightStyle = document.createElement("style");

// highlightName -> CSS text node
const highlightCssNodes = new Map<string, Text>();

/**
 * 向 head 添加 highlight 样式
 * @param highlightName highlight 名称
 */
function addStyleToHead(highlightName: string) {
  const styleContent = document.createTextNode(`
::highlight(${highlightName}) {
  background-color: #ffeb3b;
  color: #000;
}`);
  globalHighlightStyle.appendChild(styleContent);
  highlightCssNodes.set(highlightName, styleContent);
  if (!document.head.contains(globalHighlightStyle)) {
    document.head.appendChild(globalHighlightStyle);
  }
}

/** 确保某个 highlightName 只有一个 style 标签 */
function ensureStyleFor(highlightName: string) {
  if (!highlightCssNodes.has(highlightName)) {
    addStyleToHead(highlightName);
  }
}

/** 移除 highlight style（当没有任何元素使用时） */
function removeStyleFor(highlightName: string) {
  const node = highlightCssNodes.get(highlightName);
  if (node) {
    globalHighlightStyle.removeChild(node);
    highlightCssNodes.delete(highlightName);
  }
}

/**
 * 查询指定元素下的所有文本节点
 * @param node 要查询的元素
 * @returns 文本节点数组
 */
export function queryTextNodes(node: Element) {
  const nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let currentNode: Node | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: nodeIterator
  while ((currentNode = nodeIterator.nextNode())) {
    textNodes.push(currentNode as Text);
  }
  return textNodes;
}

const temp = document.createElement("div");
Object.assign(temp.style, { width: 0, height: 0 });
/**
 * 替换文本中的特殊空白字符
 * @param fullText 要替换的文本
 * @returns 替换后的文本
 */
function replaceEmptyText(fullText: string) {
  const weirdSpaceRegex =
    /[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\u200B-\u200D\u2060\uFEFF]/g;
  return `${fullText}`.replace(weirdSpaceRegex, " ");
}
/**
 * 获取文本节点的实际文本内容
 * @param node 文本节点
 * @returns 实际文本内容
 */
function getInnerText(node: Text) {
  const parentNode = node.parentNode as HTMLElement;
  let text = "";
  if (parentNode!.childNodes.length === 1) {
    text = parentNode.innerText;
  } else {
    // 克隆节点，不包含子节点
    const clone = node.cloneNode(false);
    // 将克隆的节点添加到临时容器中
    temp.appendChild(clone);
    // 获取父节点的计算样式
    const originEffectStyle = getComputedStyle(parentNode);
    // 将父节点的显示、可见性、单词拆分、单词间距和Unicode双向属性赋值给临时容器的样式
    Object.assign(temp.style, {
      display: originEffectStyle.display,
      visibility: originEffectStyle.visibility,
      whiteSpace: originEffectStyle.whiteSpace,
      wordBreak: originEffectStyle.wordBreak,
      wordSpacing: originEffectStyle.wordSpacing,
      unicodeBidi: originEffectStyle.unicodeBidi,
    });
    // 将临时容器添加到文档体中
    document.body.appendChild(temp);
    // 获取临时容器的文本内容
    text = temp.innerText;
    // 从文档体中移除临时容器
    temp.remove();
    // 从临时容器中移除克隆的节点
    temp.removeChild(clone);
  }
  return replaceEmptyText(text);
}

/**
 * 获取元素的文本节点及其全局偏移
 * @param ele 要查询的元素
 * @returns 包含所有文本节点及其全局偏移的对象
 */
function getNodeOffsetsFromInnerText(ele: HTMLElement) {
  const allTextNodes = queryTextNodes(ele);
  // 包含所有空白字符 + 所有零宽字符
  const fullText = replaceEmptyText(ele.innerText);
  const nodeOffsets: NodeOffset[] = [];
  let pos = 0;
  allTextNodes.forEach((node) => {
    // 获取节点的文本内容
    const text = getInnerText(node);
    // 在全文中从当前位置开始查找节点的文本内容
    const idx = fullText.indexOf(text, pos);
    // 如果找到了匹配的文本
    if (idx !== -1) {
      // 更新当前位置为找到的文本的起始位置
      pos = idx;
      // 记录文本的起始位置
      const start = pos;
      // 更新当前位置为找到的文本的结束位置
      pos += text.length;
      // 记录文本的结束位置
      const end = pos;
      // 将节点的信息添加到节点偏移数组中
      nodeOffsets.push({
        node,
        start,
        end,
        innerText: text,
        data: node.data,
      });
    }
  });
  return { fullText, nodeOffsets };
}

/**
 * 根据关键词获取匹配的 Range 数组
 * @param ele 要查询的元素
 * @param keyword 关键词
 * @returns 匹配的 Range 数组
 */
function getRangesByKeyword(ele: HTMLElement, keyword: string) {
  // 1. 搜集文本节点并计算全局偏移
  const { fullText, nodeOffsets } = getNodeOffsetsFromInnerText(ele);
  // 2. 找到所有匹配位置，构造 Range 数组
  const ranges: Range[] = [];
  let pos = 0;
  console.log(nodeOffsets);
  // biome-ignore lint/suspicious/noAssignInExpressions: keyword
  while ((pos = fullText.indexOf(keyword, pos)) !== -1) {
    const startInfo = findNodeAtOffset(nodeOffsets, pos);
    const endInfo = findNodeAtOffset(nodeOffsets, pos + keyword.length);
    if (startInfo && endInfo) {
      const match = endInfo.innerText.slice(0, endInfo.offset);
      const data = endInfo.data;
      // 初始化匹配索引i和数据索引j
      let i = 0;
      let j = 0;
      // 初始化一个布尔变量u，用于标记是否发生不匹配
      let u = false;
      // 当匹配索引i小于匹配字符串长度且数据索引j小于数据字符串长度时，继续循环
      while (i < match.length && j < data.length) {
        // 如果当前数据字符与匹配字符相等，则匹配索引i和数据索引j都加1
        if (match[i] === " " || data[j] === match[i]) {
          i++;
          j++;
        } else {
          // 如果当前数据字符与匹配字符不相等，则数据索引j加1，并设置u为true
          j++;
          u = true;
        }
      }
      const range = new Range();
      range.setStart(startInfo.node, startInfo.offset);
      range.setEnd(endInfo.node, u ? j - 1 : j);
      ranges.push(range);
    }
    pos += keyword.length;
  }
  return ranges;
}

// 自定义函数：搜索并高亮关键词
/** 主高亮函数（会把 ranges 注册到 registry，并返回一个用于清理当前 ele 高亮的函数） */
export function highlight(
  ele: HTMLElement,
  keyword: string,
  highlightName = "search-yellow",
) {
  const ranges = keyword ? getRangesByKeyword(ele, keyword) : [];
  // 2. 注册（替换该元素在 highlightName 下的 ranges）
  registerHighlight(ele, ranges, highlightName);
  // 3. 返回清理函数：只移除当前元素在该 highlightName 下的 ranges
  return () => {
    clearElementHighlight(ele, highlightName);
  };
}

/**
 * 注册/更新某个元素在指定 highlightName 下的 ranges（替换该元素之前的 ranges）
 * 会把该 highlightName 下所有元素的 ranges 合并，再 set 到 CSS.highlights
 */
export function registerHighlight(
  ele: Element,
  ranges: Range[],
  highlightName: string,
) {
  // 获取或创建 per-name map
  let per = highlightRegistry.get(highlightName);
  if (!per) {
    per = new Map<Element, Range[]>();
    highlightRegistry.set(highlightName, per);
  }

  // 存储/替换该元素的 ranges
  per.set(ele, ranges.slice()); // 保持数组副本，避免外部修改影响

  // 合并所有元素的 ranges 并设置 Highlight
  const combined: AbstractRange[] = [];
  per.forEach((rArr) => {
    if (Array.isArray(rArr) && rArr.length) combined.push(...rArr);
  });

  // 如果没有任何 ranges，则删除 highlight 与样式
  if (combined.length === 0) {
    if (CSS.highlights.has(highlightName)) CSS.highlights.delete(highlightName);
    removeStyleFor(highlightName);
    return;
  }

  // 确保 style 只创建一次
  ensureStyleFor(highlightName);

  // 创建并设置 Highlight
  const highlight = new Highlight(...combined);
  CSS.highlights.set(highlightName, highlight);

  // 返回当前 highlight 对象（可选）
  return highlight;
}

/**
 * 删除某个元素在指定 highlightName 下的 ranges（不影响其他元素）
 * 若该 highlightName 无剩余元素，则会删除全局 highlight 与 style
 */
export function clearElementHighlight(ele: Element, highlightName: string) {
  const per = highlightRegistry.get(highlightName);
  if (!per) return;

  per.delete(ele);

  // 重建或删除全局 highlight
  const combined: AbstractRange[] = [];
  per.forEach((rArr) => {
    if (Array.isArray(rArr) && rArr.length) combined.push(...rArr);
  });

  if (combined.length === 0) {
    // 没有任何元素的 ranges，彻底清除
    if (CSS.highlights.has(highlightName)) CSS.highlights.delete(highlightName);
    removeStyleFor(highlightName);
    highlightRegistry.delete(highlightName);
  } else {
    // 重新设置合并后的 Highlight
    const highlight = new Highlight(...combined);
    CSS.highlights.set(highlightName, highlight);
  }
}

/**
 * 根据全局文本偏移，找到对应的文本节点和节点内偏移
 * @param nodeOffsets 节点偏移数组
 * @param globalOffset 全局字符偏移
 */
function findNodeAtOffset(
  nodeOffsets: NodeOffset[],
  globalOffset: number,
): ({ offset: number } & NodeOffset) | null {
  for (const { start, end, ...rest } of nodeOffsets) {
    if (globalOffset >= start && globalOffset < end) {
      return { ...rest, start, end, offset: globalOffset - start };
    }
  }
  return null;
}
