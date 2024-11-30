export function shortUUID(inputString: string) {
    // 使用 SHA-256 哈希并转为 Base64 编码
    const hashBuffer = new TextEncoder().encode(inputString);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    // 截取前 8 位
    return hash.substring(0, 8).toLowerCase();
}