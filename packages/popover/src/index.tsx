import * as React from "react"
import {useLayoutEffect, useMemo, useRef} from "react"
import {createPortal} from "react-dom";
import {getIntersection, ScrollObserver, shortUUID, getIntersectionStatus} from "@ixe/utils";
import Ref from "@ixe/ref";
import useInject from "@ixe/css";
import {Offset, Placement, Trigger} from "./interface";
import {PlacementStrategy} from "./strategy";
import useTrigger from "./useTrigger";

export type {
    Placement,
    Trigger
}

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
    placement?: Placement;
    /**
     * 触发行为，可选 hover | focus | click | contextMenu，
     * 可使用数组设置多个触发行为
     */
    trigger?: Trigger | Trigger[];
    /**
     * 鼠标移入后延时多少才显示，单位：秒
     * */
    mouseEnterDelay?: number;
    /**
     * 鼠标移出后延时多少才隐藏，单位：秒
     * */
    mouseLeaveDelay?: number;
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
         box-sizing: border-box;
    }
     .${prefixCls}anchor .${prefixCls}content {
         position:relative;
         z-index:1;
         display:flex;
         align-items: center;
         justify-content: center;
         flex-direction: column;
         gap: 0.5em;
         background-clip: padding-box;
         border-radius: 4px;
         box-sizing: border-box;
         pointer-events: all;
         width: fit-content;
         height: fit-content;
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


const Popover = (
    {
        content,
        children,
        prefixCls = `${shortUUID(css(''))}`,
        placement = 'top',
        ...rest
    }: PopoverProps
) => {
    if (!prefixCls.endsWith('-')) {
        prefixCls = `${prefixCls}-`
    }
    const ref = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const maskContentRef = useRef<HTMLDivElement>(null);

    const [open] = useTrigger(rest, ref, maskContentRef)

    useInject(css(prefixCls));

    const updateContentStyle = (
        intersection: DOMRect,
        rect: DOMRect,
        offset: Offset
    ) => {
        const status = getIntersectionStatus(rect, intersection);
        const {x, y, width, height} = intersection;
        const target = maskRef.current!
        const content = maskContentRef.current!;
        const {height: contentHeight, width: contentWidth} = content.getBoundingClientRect();
        let tx = x;
        let ty = y;
        let maskWidth = width;
        let maskHeight = height;
        if (placement?.startsWith('top')) {
            ty = y - contentHeight;
            maskHeight = height + contentHeight;
        } else if (placement?.startsWith('left')) {
            tx = x - contentWidth;
            maskWidth = width + contentWidth
        } else if (placement?.startsWith('bottom')) {
            ty = y;
            maskHeight = height + contentHeight
        } else if (placement?.startsWith('right')) {
            tx = x;
            maskWidth = width + contentWidth
        }
        //const tx = x - contentWidth;
        //const ty = y - contentHeight;

        target.style.transform = `translate(${tx}px,${ty}px)`;
        target.style.opacity = '1';

        target.style.width = `${maskWidth}px`;
        target.style.height = `${maskHeight}px`;
        //target.style.width = `${width + 2 * contentWidth}px`;
        //target.style.height = `${height + 2 * contentHeight}px`;

        content.style.transform = `translate(${(rect.x - tx + offset.tx)}px,${(rect.y - ty + offset.ty)}px)`;
        //content.style.transform = `translate(${(rect.x - tx)}px,${(rect.y - ty)}px)`;
        if (status.direction === 'bottom') {
            console.log(status.ratio);
            content.style.opacity = `${status.ratio}`;
        } else {
            content.style.opacity = '1';
        }
    }

    const getOffsetByPlacement = useMemo(() => () => {
        const target = ref.current!
        const content = maskContentRef.current!;
        const targetRect = target.getBoundingClientRect();
        const rect = content.getBoundingClientRect();
        return PlacementStrategy[placement]?.(targetRect, rect)
    }, [placement])


    useLayoutEffect(() => {
        const target = ref.current!
        if (!target || !open) {
            return () => void 0
        }
        const setStyle = (boundingClientRect: DOMRect) => {
            const offset = getOffsetByPlacement()
            const {intersectionRect} = getIntersection(target.parentElement!);
            maskRef.current!.style.opacity = '0';
            updateContentStyle(intersectionRect, boundingClientRect, offset);
            maskRef.current!.style.opacity = '1';
        }

        const boundingClientRect = target.getBoundingClientRect();
        setStyle(boundingClientRect)

        const rob = new ResizeObserver(() => {
            const boundingClientRect = target.getBoundingClientRect();
            setStyle(boundingClientRect)
        });

        rob.observe(target);
        const sb = new ScrollObserver((entries) => {
            entries.forEach(entry => {
                const boundingClientRect = entry.boundingClientRect;
                setStyle(boundingClientRect)
            });
        })
        sb.observe(target);
        return () => {
            rob.unobserve(target)
            rob.disconnect();
            sb.unobserve(target);
            sb.disconnect();
        }
    }, [prefixCls, open, getOffsetByPlacement, placement])

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
