import * as React from "react"
import {createPortal} from "react-dom";
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {getIntersection, ScrollObserver, shortUUID} from "@ixe/utils";
import Ref from "@ixe/ref";
import useInject from "@ixe/css";

type Placement =
    'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom'

export interface PopoverProps {
    /**
     * 设置 Spin 组件的 CSS 类前缀，默认为 'ant-spin'。
     * 可用于自定义样式。
     */
    prefixCls?: string;

    /**
     * 子元素，通常是被加载的内容。当 spinning 为 true 时，会显示加载状态。
     */
    children?: React.ReactNode;

    content?: React.ReactNode;
    placement?: Placement
}


const css = (
    prefixCls: string
) => `
    .${prefixCls}anchor {
         position: fixed;
         left:0;
         top:0;
         width:0;
         height:0;
    }
    .${prefixCls}anchor>.${prefixCls}mask {
         display:flex;
         overflow: hidden;
         opacity: 0;
         width:fit-content;
         height:fit-content;
         pointer-events: none;
         position:relative;
         z-index:0;
    }
     .${prefixCls}anchor .${prefixCls}content {
         position:relative;
         z-index:1;
         display:flex;
         align-items: center;
         justify-content: center;
         flex-direction: column;
         gap: 0.5em;
         background-color: #ffffff;
         background-clip: padding-box;
         border-radius: 8px;
         box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
         padding: 12px;
         border-radius: 4px;
         box-sizing: border-box;
         pointer-events: all;
    }
    .${prefixCls}anchor .${prefixCls}indicator{
        line-height:0;
        animation: ${prefixCls}rotateAnimation 1s linear infinite; /* 应用动画 */
    }
    
    .${prefixCls}anchor .${prefixCls}tip{
        font-size:0.5em;
        line-height: 1;
    }
    
    @keyframes ${prefixCls}rotateAnimation {
        0% {
            transform: rotate(0deg); /* 初始角度 */
        }
        100% {
            transform: rotate(360deg); /* 旋转一圈 */
        }
    }
    `

type PlacementConfig = {
    [key in Placement]: (
        rect: DOMRect,
        targetRect: DOMRect
    ) => DOMRect;
};

const PlacementConfig: PlacementConfig = {
    top: (rect, targetRect) => {
        const {x, y, width} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width / 2 - targetWidth / 2,
            y: y - targetHeight,
            width: targetWidth,
            height: targetHeight,
        };
    },
    left: (rect, targetRect) => {
        const {x, y, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x - targetWidth,
            y: y + height / 2 - targetHeight / 2,
            width: targetWidth,
            height: targetHeight,
        };
    },
    right: (rect, targetRect) => {
        const {x, y, width, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width,
            y: y + height / 2 - targetHeight / 2,
            width: targetWidth,
            height: targetHeight,
        };
    },
    bottom: (rect, targetRect) => {
        const {x, y, width, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width / 2 - targetWidth / 2,
            y: y + height,
            width: targetWidth,
            height: targetHeight,
        };
    },
    topLeft: (rect, targetRect) => {
        const {x, y} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x,
            y: y - targetHeight,
            width: targetWidth,
            height: targetHeight,
        };
    },
    topRight: (rect, targetRect) => {
        const {x, y, width} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width - targetWidth,
            y: y - targetHeight,
            width: targetWidth,
            height: targetHeight,
        };
    },
    bottomLeft: (rect, targetRect) => {
        const {x, y, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x,
            y: y + height,
            width: targetWidth,
            height: targetHeight,
        };
    },
    bottomRight: (rect, targetRect) => {
        const {x, y, width, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width - targetWidth,
            y: y + height,
            width: targetWidth,
            height: targetHeight,
        };
    },
    leftTop: (rect, targetRect) => {
        const {x, y} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x - targetWidth,
            y,
            width: targetWidth,
            height: targetHeight,
        };
    },
    leftBottom: (rect, targetRect) => {
        const {x, y, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x - targetWidth,
            y: y + height - targetHeight,
            width: targetWidth,
            height: targetHeight,
        };
    },
    rightTop: (rect, targetRect) => {
        const {x, y, width} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width,
            y,
            width: targetWidth,
            height: targetHeight,
        };
    },
    rightBottom: (rect, targetRect) => {
        const {x, y, width, height} = rect;
        const {width: targetWidth, height: targetHeight} = targetRect;
        return {
            ...rect,
            x: x + width,
            y: y + height - targetHeight,
            width: targetWidth,
            height: targetHeight,
        };
    }
};

const Popover = (
    {
        content,
        children,
        prefixCls = `${shortUUID(css(''))}`,
        placement = 'top',
    }: PopoverProps
) => {
    if (!prefixCls.endsWith('-')) {
        prefixCls = `${prefixCls}-`
    }
    const ref = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const maskContentRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false)
    useInject(css(prefixCls));

    const setViewBoxStyle = (rect: DOMRect) => {
        const {x, y, width, height} = rect;
        const target = maskRef.current!
        const content = maskContentRef.current!;
        const {height: contentHeight, width: contentWidth} = content.getBoundingClientRect();
        target.style.transform = `translate(${x - contentWidth}px,${y - contentHeight}px)`;
        target.style.opacity = '1';
        target.style.width = `${width + 2 * contentWidth}px`;
        target.style.height = `${height + 2 * contentHeight}px`;
        target.style.opacity = '1';
    }

    const setContentStyle = (rect: DOMRect, bound: DOMRect) => {
        const {x, y} = rect;
        const content = maskContentRef.current!;
        const {height, width} = content.getBoundingClientRect();
        content.style.transform = `translate(${bound.x - x + width}px,${bound.y - y + height}px)`;
        content.style.width = `${bound.width}px`;
        content.style.height = `${bound.height}px`;
    }

    function getParamsByPlacement(rect: DOMRect) {
        const target = ref.current!
        const targetRect = target.getBoundingClientRect();
        return PlacementConfig[placement]?.(rect, targetRect)
    }


    useEffect(() => {
        const target = ref.current!
        if (!target) {
            return () => void 0
        }
        const handleClick = (e: MouseEvent) => {
            console.log('click', e);
            setOpen(true);
            e.stopPropagation();
            const onOutClick = (ev: MouseEvent) => {
                console.log('xxx', ev.target, maskContentRef.current!.contains(ev.target! as HTMLElement))
                if (!maskContentRef.current!.contains(ev.target! as HTMLElement)) {
                    setOpen(false);
                    document.removeEventListener('click', onOutClick)
                }
            }
            document.addEventListener('click', onOutClick)
        }

        target.addEventListener('click', handleClick)

        return () => {
            target.removeEventListener('click', handleClick)
        }
    }, [prefixCls])


    useLayoutEffect(() => {
        const target = ref.current!
        if (!target || !open) {
            return () => void 0
        }
        const rob = new ResizeObserver(() => {
            const {intersectionRect} = getIntersection(target.parentElement!);
            setViewBoxStyle(intersectionRect);
            const boundingClientRect = target.getBoundingClientRect();
            const offset = getParamsByPlacement(boundingClientRect)
            setContentStyle(intersectionRect, offset)
        });
        rob.observe(target);
        const sb = new ScrollObserver((entries) => {
            entries.forEach(entry => {
                const {intersectionRect} = getIntersection(target.parentElement!);
                setViewBoxStyle(intersectionRect);
                const offset = getParamsByPlacement(entry.boundingClientRect)
                setContentStyle(intersectionRect, offset)
            });
        })
        sb.observe(target);
        return () => {
            rob.unobserve(target)
            rob.disconnect();
            sb.unobserve(target);
            sb.disconnect();
        }
    }, [prefixCls, open])

    return (
        <>
            <Ref ref={ref}>
                {children}
            </Ref>
            {
                open && createPortal(
                    <div className={`${prefixCls}anchor`}>
                        <div className={`${prefixCls}mask`} ref={maskRef}>
                            <div className={`${prefixCls}content`} ref={maskContentRef}>
                                {content}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>

    )
}

export default Popover
