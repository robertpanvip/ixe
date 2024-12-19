import * as React from "react";
import {shortUUID} from "@ixe/utils";
import {toKebabCase, dfs} from "@ixe/utils";
import {setStyleValue} from "./util";

const styleMap = new Map<string, number>();

const useInsertionEffect = React.useInsertionEffect || React.useLayoutEffect;

export type CSSText = string

type ClassName = string;
type Condition = string;

type PseudoClass<CSSProperties> = {
    /**css hover .a:hover{}*/
    hover?: CSSProperties;
    /**css active .a:active{}*/
    active?: CSSProperties;
    /**css focus .a:focus{}*/
    focus?: CSSProperties;
    /**css focusWithin .a:focusWithin{}*/
    focusWithin?: CSSProperties;
    /**css focusVisible .a:focusVisible{}*/
    focusVisible?: CSSProperties;
    /**css target .a:target{}*/
    target?: CSSProperties;

    /** css visited .a:visited{} */
    visited?: CSSProperties;
    /** css disabled .a:disabled{} */
    disabled?: CSSProperties;
    /** css checked .a:checked{} */
    checked?: CSSProperties;
    /** css enabled .a:enabled{} */
    enabled?: CSSProperties;
    /** css empty .a:empty{} */
    empty?: CSSProperties;
    /** css root .a:root{} */
    root?: CSSProperties;
    /** css valid .a:valid{} */
    valid?: CSSProperties;
    /** css invalid .a:invalid{} */
    invalid?: CSSProperties;
    /** css optional .a:optional{} */
    optional?: CSSProperties;
    /** css required .a:required{} */
    required?: CSSProperties;
    /** css lang .a:lang{} */
    lang?: Record<string, CSSProperties>;
    /** css indeterminate .a:indeterminate{} */
    indeterminate?: CSSProperties;

    /** css first-child .a:first-child{} */
    firstChild?: CSSProperties;
    /** css first-of-type .a:first-of-type{} */
    firstOfType?: CSSProperties;
    /** css  last-of-type .a:last-of-type{} */
    lastOfType?: CSSProperties;
    /** css last-child .a:last-child{} */
    lastChild?: CSSProperties;

    /** css only-child .a:only-child{} */
    onlyChild?: CSSProperties;
    /** css only-of-type .a:only-of-type{} */
    onlyOfType?: CSSProperties;


    /**css nth-child .a:nth-child{}*/
    nthChild?: Record<number, CSSProperties>;
    /**css nth-last-child .a:nth-last-child{}*/
    nthLastChild?: Record<number, CSSProperties>;
    /**css nth-last-child .a:nth-last-child{}*/
    nthCol?: Record<number, CSSProperties>;
    /**css nth-last-col .a:nth-last-col{}*/
    nthLastCol?: Record<number, CSSProperties>;
    /**css nth-of-type .a:nth-of-type{}*/
    nthOfType?: Record<number, CSSProperties>;
    /**css nth-last-of-type .a:nth-last-of-type{}*/
    nthLastOfType?: Record<number, CSSProperties>;

    /**css not .a:not{}*/
    not?: Record<Condition, CSSProperties>;


}
type PseudoElement<CSSProperties> = {
    /**css before 会编译为 .a::before{}*/
    before?: CSSProperties;
    /**css after .a::after{}*/
    after?: CSSProperties;
    /**css first-letter .a::first-letter{}*/
    firstLetter?: CSSProperties;
    /**css first-line .a::first-line{}*/
    firstLine?: CSSProperties;
    /**css selection .a::selection{}*/
    selection?: CSSProperties;
    /**css marker .a::marker{}*/
    marker?: CSSProperties;
    /**css backdrop .a::backdrop{}*/
    backdrop?: CSSProperties;
    /** web components的::part */
    part?: CSSProperties;
    /** web components的::slotted */
    slotted?: CSSProperties;
}

type Pseudo<CSSProperties> = PseudoElement<CSSProperties> | PseudoClass<CSSProperties>

export type ClassesProperties=Record<ClassName, Partial<CSSProperties>>;

export interface CSSProperties extends React.CSSProperties {
    /** 选择器类型：. 为类选择器，# 为 ID 选择器，空字符串为元素选择器 */
    type?: '.' | '#' | ''; // 默认为 .
    /** 伪元素和伪类*/
    pseudo?: Pseudo<Partial<CSSProperties>>
    /** css @keyframes */
    keyframes?: Record<Condition, Record<string, Partial<CSSProperties>>>

    /** 支持媒体查询 @media */
    media?: Record<Condition, Record<ClassName, Partial<CSSProperties>>>;

    /** 支持 @supports 条件 */
    supports?: Record<Condition, Record<ClassName, Partial<CSSProperties>>>;

    /**后代 会编译为 .a .b{}*/
    descendant?: Record<ClassName, Partial<CSSProperties>>

    /**直接子类 会编译为 .a>.b{} */
    children?: Record<ClassName, Partial<CSSProperties>>

    /**相邻兄弟选择器+ 会编译为 .a+.b{} */
    next?: Record<ClassName, Partial<CSSProperties>>

    /**通用兄弟选择器~ 会编译为 .a~.b{}**/
    siblings?: Record<ClassName, Partial<CSSProperties>>

    /**css变量 **/
    var: Record<string, string | number | boolean>
}

const pseudoClasses = [
    'hover', 'active', 'focus', 'focusWithin', 'focusVisible',
    'target', 'visited', 'disabled', "checked", "enabled", 'empty', "root",
    "valid", "invalid", "optional", "required", "lang", "indeterminate",
    "firstChild", "firstOfType", "lastOfType", "lastChild", "onlyChild", 'onlyOfType'
] as const;

const pseudoNthClasses = [
    'nthChild', 'nthLastChild', 'nthLastCol', 'nthOfType', 'nthLastOfType', "not"
] as const;

const pseudoElements = [
    'before', 'after', 'firstLetter', 'firstLine', 'selection', "backdrop", "part", "slotted", "pseudoMarker"
] as const

const kms = ['keyframes', 'media', 'supports'] as const;

const SubSymbol = {
    children: ' ',
    descendant: '>',
    siblings: '~',
    next: '+'
} as const


function parse(style: Partial<CSSProperties>) {
    let result = '\n'
    Object.entries(style).forEach(([key, val]) => {
        if (key !== 'type' && typeof val !== 'object') {
            result += `  ${toKebabCase(key)}:${setStyleValue(key, val)};\n`
        }
        if (key === 'var') {
            Object.entries(val).forEach(([key, value]) => {
                result += `  --${toKebabCase(key)}:${value};\n`
            })
        }

    })
    return result
}

// 生成 CSS 字符串
function generateCSS(classes: ClassesProperties) {
    const result: string[] = [];

    Object.entries(classes).forEach(([key, val]) => {
        const selector = `${val.type || '.'}${toKebabCase(key)}`
        result.push(`${selector}{${parse(val)}}`);

        const loop = (
            val: Partial<CSSProperties>,
            selector: string
        ) => {
            Object.entries(SubSymbol).forEach(([key, tag]) => {
                const symbol = key as keyof typeof SubSymbol;
                const classes = val[symbol];

                classes && dfs(classes, symbol, (item, key) => {
                    const _selector = `${selector}${tag}${item.type || '.'}${toKebabCase(key)}`
                    result.push(`${_selector}{${parse(item)}}`);
                    loop(item, _selector)
                })
            });

            if (val.pseudo) {
                Object.entries(val.pseudo).forEach(([key, value]) => {
                    if (pseudoNthClasses.includes(key as keyof Pseudo<CSSProperties>)) {
                        Object.entries(value).forEach(([label, c]) => {
                            const _selector = `${selector} :${toKebabCase(key)}(${label})`;
                            const content = generateCSS({
                                '': {
                                    ...c,
                                    type: ' '
                                },
                            }).trim().slice(1, -1);

                            result.push(`${_selector}{\n${content}}`);
                        })
                    } else {
                        let pseudo = ''
                        if (pseudoClasses.includes(key as keyof Pseudo<CSSProperties>)) {
                            pseudo = `:${key}`
                        } else if (pseudoElements.includes(key as keyof Pseudo<CSSProperties>)) {
                            pseudo = `::${key}`
                        }
                        const _selector = `${selector}${pseudo}`
                        result.push(`${_selector}{${parse(value)}}`);
                    }
                })

            }
            kms.map(item => {
                const values = val[item];
                values && Object.entries(values).forEach(([key, value]) => {
                    const _selector = `${selector} @${item} (${key})`
                    result.push(`${_selector}{\n${generateCSS(value)}}`);
                })
            })
        }
        loop(val, selector)
    })
    return result.join('\n')
}


export function useCSS<T>(getStyle: (deps: T[]) => ClassesProperties, deps: T[] = []) {
    useInsertionEffect(() => {
        const textContent = generateCSS(getStyle(deps));
        let count = styleMap.get(textContent) || 0
        count = count + 1;
        styleMap.set(textContent, count);
        if (count === 1) {
            const style = document.createElement('style');
            style.textContent = textContent;
            style.dataset.key = 'pan';
            document.head.appendChild(style)
        }
        return () => {
            count = count - 1;
            styleMap.set(textContent, count);
        }
    }, [deps])
}


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