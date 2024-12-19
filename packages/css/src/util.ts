/**
 * CSS properties which accept numbers but are not in units of "px".
 */
const isUnitLessNumber = {
    animationIterationCount: true,
    aspectRatio: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridArea: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    // SVG-related properties
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
};

export function setStyleValue(name: string, value: unknown) {
    const isCustomProperty = name.indexOf('--') === 0;
    if (!isCustomProperty && typeof value === 'number' && !(Object.prototype.hasOwnProperty.call(isUnitLessNumber, name) && isUnitLessNumber[name as keyof typeof isUnitLessNumber])) {
        return value + 'px'; // Presumes implicit 'px' suffix for unitless numbers
    }
    return value;
}


function prefixKey(prefix: string, key: string) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */


const prefixes = ['Webkit', 'ms', 'Moz', 'O']; // Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.

Object.keys(isUnitLessNumber).forEach(function (prop) {
    prefixes.forEach(function (prefix) {
        const key = prefixKey(prefix, prop) as unknown as keyof typeof isUnitLessNumber;
        isUnitLessNumber[key] = isUnitLessNumber[prop as keyof typeof isUnitLessNumber];
    });
});