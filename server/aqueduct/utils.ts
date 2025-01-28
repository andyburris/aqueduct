type Change = {
    path: string,
    operation: "add" | "delete" | "update",
    value: any,
}
function diff(original: any, updated: any, path: string = ''): Change[] {
    const changes: Change[] = []
    for(const key in updated) {
        const currentPath = path ? `${path}.${key}` : key
        if (!original.hasOwnProperty(key)) {
            changes.push({ path: currentPath, operation: "add", value: updated[key] })
        } else if (typeof updated[key] === 'object' && updated[key] !== null && typeof original[key] === 'object' && original[key] !== null) {
            changes.push(...diff(original[key], updated[key], currentPath))
        } else if (original[key] !== updated[key]) {
            changes.push({ path: currentPath, operation: "update", value: updated[key] })
        }
    }
    for(const key in original) {
        const currentPath = path ? `${path}.${key}` : key
        if (!updated.hasOwnProperty(key)) {
            changes.push({ path: currentPath, operation: "delete", value: original[key] })
        }
    }
    return changes
}