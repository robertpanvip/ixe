export function dfs<T extends object>(
    data: T,
    iteratorKey: string,
    callback: (item: T, key: string, path: string[], parent: T) => void
) {
    // 递归遍历对象或数组
    if (typeof data === 'object' && data !== null) {
        const keys: string[] = [];
        // 如果是对象，遍历对象的每个属性
        Object.entries(data).forEach(([key, value]) => {
            callback(value, key, keys, data);
            // 如果 keyPath 存在并且当前 key 匹配，则继续递归
            if (iteratorKey == key) {
                keys.push(key);
                dfs(value, iteratorKey, (item, key, _path, parent) => {
                    callback(item, key, [...keys, ..._path], parent)
                }); // 递归处理
            }
        });
    }
}