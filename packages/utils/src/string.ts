export function shortUUID(inputString: string) {
    // 使用 SHA-256 哈希并转为 Base64 编码
    const hashBuffer = new TextEncoder().encode(inputString);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    // 截取前 8 位
    return hash.substring(0, 8).toLowerCase();
}

export function toKebabCase(str: string): string {
    return str
        // 在大写字母前添加一个空格
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        // 将所有大写字母转为小写字母
        .toLowerCase();
}
