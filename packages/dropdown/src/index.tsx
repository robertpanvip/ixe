import {shortUUID} from "@ixe/utils";
import useInject from "@ixe/css";
import Popover, {PopoverProps} from "@ixe/popover";
import React, {ReactNode} from "react";

export type ItemType = {
    /**标题*/
    label: React.ReactNode;
    /**唯一标志*/
    key: string | number;
    /**菜单图标*/
    value: React.ReactNode;
    /**菜单图标*/
    disabled?: boolean;
    /**菜单图标*/
    icon?: ReactNode;
    /**子项*/
    children?: ItemType[]
}

export interface DropdownProps extends Omit<PopoverProps, "content"> {
    /**自定义下拉框内容*/
    dropdownRender?: () => React.ReactNode;
    items?: ItemType[]
}


const css = (
    prefixCls: string
) => `
    .${prefixCls}-dropdown-menu {
        padding: 4px;
        list-style-type: none;
        background-color: white;
        background-clip: padding-box;
        border-radius: 4px;
        outline: none;
        box-shadow:  0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    }
    .${prefixCls}-dropdown-menu>.${prefixCls}-dropdown-menu-item{
        display:flex;
        margin:0;
        padding:4px 12px;
    }
    .${prefixCls}-dropdown-menu>.${prefixCls}-dropdown-menu-item:hover{
        background-color:rgba(0, 0, 0, 0.04);
        border-radius:4px;
    }
    `


const Dropdown = (
    {
        children,
        prefixCls = `${shortUUID(css(''))}`,
        dropdownRender,
        placement = 'bottomLeft',
        items = [],
    }: DropdownProps
) => {
    if (!prefixCls.endsWith('-')) {
        prefixCls = `${prefixCls}-`
    }
    useInject(css(prefixCls));

    const getFlatOptions = (options: ItemType[] = []): ItemType[] => {
        return options?.flatMap(item => [item, ...(getFlatOptions(item.children))])
    }

    const options = React.useMemo(() => getFlatOptions(items), [items])

    const content = dropdownRender ? dropdownRender() : (
        <div className={`${prefixCls}-dropdown-menu`}>
            {
                options.map(item => {
                    return <div key={item.key} className={`${prefixCls}-dropdown-menu-item`}>{item.label}</div>
                })
            }
        </div>
    )

    return (
        <Popover placement={placement} content={content}>
            {children}
        </Popover>
    )
}

export default Dropdown
