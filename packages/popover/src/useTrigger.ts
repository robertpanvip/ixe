import {Timer} from "@ixe/utils";
import {Trigger} from "./interface.ts";
import {RefObject, useEffect, useState} from "react";
import {PopoverProps} from "./index.tsx";

const EventMap = {
    'click': 'click',
    'focus': 'blur',
    "contextmenu": 'click',
    'hover': 'mousemove'
} as const;

export default function useTrigger(
    {
        trigger = 'click',
        mouseEnterDelay = 0.1,
        mouseLeaveDelay = 0.1,
    }: PopoverProps,
    ref: RefObject<HTMLElement>,
    maskContentRef: RefObject<HTMLElement>,
) {
    const [open, setOpen] = useState(false)
    // Event handler to resolve trigger events
    const resolveTrigger = (
        target: Node,
        eventType: string,
        condition: (e: Event) => boolean,
        handler: (e: Event) => void,
        timeout: number,
    ) => {
        let timer: number | null = null;
        const onTrigger = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            if (condition(e)) {
                timer && Timer.clearInterval(timer)
                timer = Timer.setTimeout(() => handler(e), timeout * 1000);
            }
        };

        target.addEventListener(eventType, onTrigger);
        return () => {
            if (timer) Timer.clearTimeout(timer);
            target.removeEventListener(eventType, onTrigger);
        };
    };

    const applyTriggerEffect = (trigger: Trigger | Trigger[], callback: (trigger: Trigger) => () => void) => {
        const triggers = Array.isArray(trigger) ? trigger : [trigger];
        const unbinds = triggers.map(item => callback(item));
        return () => {
            unbinds.forEach(unbind => unbind())
        }
    }

    useEffect(() => {
        if (!open) {
            return () => {
            }
        }
        const contains = (content: EventTarget | null, target: EventTarget) => !!(content as HTMLElement)?.contains(target! as HTMLElement)

        return applyTriggerEffect(trigger, (item) => {
            const type = item.toLowerCase() as Lowercase<Trigger>;
            const eventType = EventMap[type];
            let currentTarget: EventTarget | null = ref.current!;
            return resolveTrigger(
                document,
                eventType,
                (ev) => {
                    const content = maskContentRef.current;
                    const target = ev.target!
                    const isSame = trigger === 'hover' && contains(currentTarget, target);
                    currentTarget = target;
                    return !isSame && !contains(content, target)
                },
                () => setOpen(false),
                mouseLeaveDelay
            );
        })
    }, [maskContentRef, mouseLeaveDelay, open, ref, trigger]);


    useEffect(() => {
        const target = ref.current!
        if (!target) {
            return () => void 0
        }
        return applyTriggerEffect(trigger, (item) => {
            const eventName = item === 'hover' ? 'mouseenter' : item?.toLowerCase() as Lowercase<Trigger>;
            return resolveTrigger(
                target,
                eventName,
                () => true,
                () => setOpen(true),
                mouseEnterDelay
            )
        })
    }, [trigger, mouseEnterDelay, mouseLeaveDelay, ref])
    return [open, setOpen] as const;
}