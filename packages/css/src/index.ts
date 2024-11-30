import * as React from "react";
import {shortUUID} from "@ixe/utils";

const styleMap = new Map<string, number>();

const useInsertionEffect = React.useInsertionEffect || React.useLayoutEffect;
const ixe=1;


console.log(ixe)
export type CSSText = string
export default function useInject(textContent: CSSText) {
    useInsertionEffect(() => {
        let count = styleMap.get(textContent) || 0
        count = count + 1;
        styleMap.set(textContent, count);
        if (count === 1) {
            const style = document.createElement('style');
            style.textContent = textContent;
            style.id = shortUUID(textContent);
            document.head.appendChild(style)
        }
        return () => {
            count = count - 1;
            styleMap.set(textContent, count);
        }
    }, [textContent])
}