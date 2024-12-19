export function isIntersecting(rect1: DOMRect, rect2: DOMRect): boolean {
    // 判断两个矩形是否有重叠
    return !(rect1.right < rect2.left || // rect1 在 rect2 的左边
        rect1.left > rect2.right || // rect1 在 rect2 的右边
        rect1.bottom < rect2.top || // rect1 在 rect2 的上方
        rect1.top > rect2.bottom);  // rect1 在 rect2 的下方
}

export function getIntersectionRatio(rect1: DOMRect, rect2: DOMRect) {
    const intersectionRect = rect1
    // 计算交集区域面积
    const intersectionArea = intersectionRect.width * intersectionRect.height;
    const elementRect = rect2;
    // 计算元素的面积
    const elementArea = elementRect.width * elementRect.height;
    return intersectionArea / elementArea
}

export type IntersectionStatus = {
    isIntersecting: boolean;
    direction?: string;
    ratio?: number
};


export function getIntersectionByRect(intersectionRect: DOMRect, scrollRect: DOMRect) {
    const intersectLeft = Math.max(intersectionRect.left, scrollRect.left);
    const intersectTop = Math.max(intersectionRect.top, scrollRect.top);
    const intersectRight = Math.min(intersectionRect.right, scrollRect.right);
    const intersectBottom = Math.min(intersectionRect.bottom, scrollRect.bottom);
    let width = intersectRight - intersectLeft;
    let height = intersectBottom - intersectTop;
    // 如果没有交集区域，跳过
    if (intersectRight <= intersectLeft) {
        width = 0;
    }
    if (intersectRight <= intersectLeft || intersectBottom <= intersectTop) {
        height = 0
    }
    return {
        x: intersectLeft,
        y: intersectTop,
        left: intersectLeft,
        top: intersectTop,
        right: intersectRight,
        bottom: intersectBottom,
        width,
        height,
    };
}

export function getIntersectionStatus(rect1: DOMRect, rect2: DOMRect): IntersectionStatus {
    // 计算矩形是否相交
    const is = isIntersecting(rect1, rect2);
    const intersectionRect = getIntersectionByRect(rect1, rect2) as DOMRect
    const ratio = getIntersectionRatio(intersectionRect, rect1)

    // 判断超出方向
    let direction = '';

    // 判断 rect1 是否超出交集矩形的某个方向
    if (rect1.right > intersectionRect.right) {
        direction = 'right';  // rect1 超出交集矩形的右边
    } else if (rect1.left < intersectionRect.left) {
        direction = 'left';   // rect1 超出交集矩形的左边
    } else if (rect1.bottom > intersectionRect.bottom) {
        direction = 'bottom'; // rect1 超出交集矩形的下边
    } else if (rect1.top < intersectionRect.top) {
        direction = 'top';    // rect1 超出交集矩形的上边
    }

    // 如果相交，则返回相交信息
    return {isIntersecting: is, direction, ratio};
}