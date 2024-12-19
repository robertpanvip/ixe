import {Offset, Placement} from "./interface";

export type PlacementStrategy = {
    [key in Placement]: (
        rect: DOMRect,
        targetRect: DOMRect
    ) => Offset;
};

export const PlacementStrategy: PlacementStrategy = {
    top: (rect, targetRect) => {
        const {width} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            tx: width / 2 - targetWidth / 2,
            ty: 0 - targetHeight,
        };
    },
    left: (rect, targetRect) => {
        const {height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            tx: 0 - targetWidth,
            ty: height / 2 - targetHeight / 2,
        };
    },
    right: (rect, targetRect) => {
        const {width, height} = rect;
        const {height: targetHeight} = targetRect;
        return {
            ...rect,
            tx: width,
            ty: height / 2 - targetHeight / 2,
        };
    },
    bottom: (rect, targetRect) => {
        const {width, height} = rect;
        const {width: targetWidth} = targetRect;
        return {
            tx: width / 2 - targetWidth / 2,
            ty: height
        };
    },
    topLeft: (_rect, targetRect) => {
        const {height: targetHeight} = targetRect;
        return {
            tx: 0,
            ty: 0 - targetHeight,
        };
    },
    topRight: (rect, targetRect) => {
        const {width} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            tx: width - targetWidth,
            ty: -targetHeight,
        };
    },
    bottomLeft: (rect) => {
        const {height} = rect;
        return {
            tx: 0,
            ty: height,
        };
    },
    bottomRight: (rect, targetRect) => {
        const {width, height} = rect;
        const {width: targetWidth} = targetRect;
        return {
            tx: width - targetWidth,
            ty: height,
        };
    },
    leftTop: (_rect, targetRect) => {
        const {width: targetWidth} = targetRect;
        return {
            tx: -targetWidth,
            ty: 0,
        };
    },
    leftBottom: (rect, targetRect) => {
        const {height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            tx: -targetWidth,
            ty: +height - targetHeight,
        };
    },
    rightTop: (rect) => {
        const {width} = rect;
        return {
            tx: width,
            ty: 0,
        };
    },
    rightBottom: (rect, targetRect) => {
        const {width, height} = rect;
        const {height: targetHeight} = targetRect;
        return {
            tx: width,
            ty: height - targetHeight,
        };
    }
};