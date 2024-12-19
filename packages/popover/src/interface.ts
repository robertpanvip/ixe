export type Placement =
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

export type Trigger = 'click' | 'focus' | 'hover' | 'contextMenu';

export type Offset = {
    tx: number;
    ty: number
}