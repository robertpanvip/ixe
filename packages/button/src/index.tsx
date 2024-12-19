import * as React from "react"
import {classNames} from "@ixe/utils";
import {ClassesProperties, useCSS} from "@ixe/css";
import {Loading} from "@ixe/svg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * 设置 Spin 组件的 CSS 类前缀，默认为 'ant-spin'。
     * 可用于自定义样式。
     */
    prefixCls?: string;

    /**
     * 子元素，通常是被加载的内容。当 spinning 为 true 时，会显示加载状态。
     */
    children?: React.ReactNode;
    /**
     * 设置按钮的变体
     */
    variant?: 'outlined' | 'dashed' | 'solid' | 'filled' | "borderless";
    /**
     * 设置按钮的颜色
     * */
    color?: 'default' | 'primary' | 'danger';
    /**
     * 设置按钮载入状态
     * */
    loading?: boolean;
    /**
     * 设置按钮形状
     * */
    shape?: 'default' | 'circle' | 'round';
    /**
     * 设置按钮的图标组件
     * */
    icon?: React.ReactNode;
    /**
     * 设置按钮大小
     * */
    size?: 'large' | 'middle' | 'small'
}


const css = ([prefix]: string[]): ClassesProperties => {
    const base = `${prefix}btn`;
    const connect = (...args: string[]) => args.join('-')
    return {
        [base]: {
            borderWidth: 1,
            borderStyle: 'solid',
            gap: 8,
            display: 'inline-flex',
            alignItems: 'center',
            justifyItems: 'center'
        },
        [connect(base,'shape','default')]: {
            borderRadius: 2
        },
        [connect(base,'shape','circle')]: {
            borderRadius: '50%'
        },
        [connect(base,'shape','round')]: {
            borderRadius: 32
        },
        [connect(base,'size','large')]: {
        },
        [connect(base,'size','middle')]: {
        },
        [connect(base,'size','small')]: {
        },
        [connect(base,'filled','default')]: {
            backgroundColor:'#d9d9d9'
        },
        [connect(base,'filled','primary')]: {
            backgroundColor:'#1677ff'
        },
        [connect(base,'filled','danger')]: {
            backgroundColor:'#ff4d4f'
        },

        [connect(base,'solid','default')]: {
            backgroundColor:'#d9d9d9',
            borderColor:'#d9d9d9'
        },
        [connect(base,'solid','primary')]: {
            backgroundColor:'#1677ff',
            borderColor:'#1677ff'
        },
        [connect(base,'solid','danger')]: {
            backgroundColor:'#ff4d4f',
            borderColor:'#ff4d4f'
        },

        [connect(base,'outlined','default')]: {
            backgroundColor:'#d9d9d9',
            borderColor:'#d9d9d9'
        },
        [connect(base,'outlined','primary')]: {
            backgroundColor:'#1677ff',
            borderColor:'#1677ff'
        },
        [connect(base,'outlined','danger')]: {
            backgroundColor:'#ff4d4f',
            borderColor:'#ff4d4f'
        },

        [connect(base,'dashed','default')]: {
            backgroundColor:'#d9d9d9',
            borderColor:'#d9d9d9'
        },
        [connect(base,'dashed','primary')]: {
            backgroundColor:'#1677ff',
            borderColor:'#1677ff'
        },
        [connect(base,'dashed','danger')]: {
            backgroundColor:'#ff4d4f',
            borderColor:'#ff4d4f'
        },
    }
}
/**
 * 用于页面和区块的加载中状态。
 */
const Button = (
    {
        children,
        prefixCls = `ixe`,
        variant = 'outlined',
        color = 'default',
        loading = false,
        shape = 'default',
        icon = null,
        size = 'middle',
        ...rest
    }: ButtonProps
) => {
    if (!prefixCls.endsWith('-')) {
        prefixCls = `${prefixCls}-`
    }

    useCSS(css, [prefixCls]);

    return (
        <button
            {...rest}
            className={
                classNames(
                    `${prefixCls}btn`,
                    `${prefixCls}btn-${variant}-${color}`,
                    `${prefixCls}btn-shape-${shape}`,
                    `${prefixCls}btn-size-${size}`
                )
            }
        >
            {loading ? <Loading/> : icon}
            <span>
               {children}
            </span>
        </button>

    )
}

export default Button
