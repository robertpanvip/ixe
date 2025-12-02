// 检查浏览器支持（Chrome 103+、Safari 16+、Firefox Nightly）
/*if (!("highlights" in CSS)) {
  console.warn("CSS Custom Highlight API 不支持！");
  return;
}*/
type NodeOffset = { node: Text; start: number; end: number };

// 全局 registry： highlightName -> (ele -> Range[])
const highlightRegistry = new Map<string, Map<Element, Range[]>>();

const globalHighlightStyle = document.createElement("style");

// highlightName -> CSS text node
const highlightCssNodes = new Map<string, Text>();

function addStyleToHead(highlightName: string) {
    const styleContent = document.createTextNode(`
::highlight(${highlightName}) {
  background-color: #ffeb3b;
  color: #000;
}`)
    globalHighlightStyle.appendChild(styleContent)
    highlightCssNodes.set(highlightName, styleContent)
    if (!document.head.contains(globalHighlightStyle)) {
        document.head.appendChild(globalHighlightStyle);
    }
}

/** 确保某个 highlightName 只有一个 style 标签 */
function ensureStyleFor(highlightName: string) {
    if (!highlightCssNodes.has(highlightName)) {
        addStyleToHead(highlightName)
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

function getNodeOffsetsFromInnerText(ele: HTMLElement) {
    const allTextNodes = queryTextNodes(ele);
    const fullText = ele.innerText; // 视觉文本，包括换行
    const nodeOffsets: NodeOffset[] = [];
    let pos = 0; // innerText 中的全局偏移

    for (const node of allTextNodes) {
        const text = node.textContent || "";
        if (!text) continue;

        // 找到 text 在 fullText 中对应的位置
        const indexInFullText = fullText.indexOf(text, pos);
        if (indexInFullText === -1) {
            // 如果 text 和 innerText 不完全匹配，需要特殊处理（可能有换行）
            // 可以按字符逐个匹配
            continue;
        }

        nodeOffsets.push({
            node,
            start: indexInFullText,
            end: indexInFullText + text.length
        });

        pos = indexInFullText + text.length;
    }

    return {fullText, nodeOffsets};
}

function getRangesByKeyword(ele: HTMLElement, keyword: string) {
    // 1. 搜集文本节点并计算全局偏移
    const {fullText, nodeOffsets} = getNodeOffsetsFromInnerText(ele)

    // 2. 找到所有匹配位置，构造 Range 数组
    const ranges: Range[] = [];
    let pos = 0;
    while ((pos = fullText.indexOf(keyword, pos)) !== -1) {
        const startInfo = findNodeAtOffset(nodeOffsets, pos);
        const endInfo = findNodeAtOffset(nodeOffsets, pos + keyword.length - 1);
        // 注意 endInfo: 我们传入最后一个字符的索引，然后在 setEnd 时使用 offset + 1
        if (startInfo && endInfo) {
            const range = new Range();
            range.setStart(startInfo.node, startInfo.offset);
            range.setEnd(endInfo.node, endInfo.offset + 1);
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
    highlightName = "search-yellow"
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
export function registerHighlight(ele: Element, ranges: Range[], highlightName: string) {
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
    per.forEach(rArr => {
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
    per.forEach(rArr => {
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
    globalOffset: number
): { node: Text; offset: number } | null {
    for (const {node, start, end} of nodeOffsets) {
        if (globalOffset >= start && globalOffset <= end) {
            return {node, offset: globalOffset - start};
        }
    }
    return null;
}
