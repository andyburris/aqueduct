export type SyncResult<T> = {
    data: T,
    changes: SyncResultChanges,
}
export class SyncResultChanges {
    constructor(public additions: Change[], public updates: Change[], public deletions: Change[]) {}
    all() { return [...this.additions, ...this.updates, ...this.deletions] }
}
export type Change = {
    path?: string,
    operation: "add" | "delete" | "update",
    value: any,
}
export function diffObject(original: any, updated: any, path: string = ''): Change[] {
    const changes: Change[] = []
    for(const key in updated) {
        const currentPath = path ? `${path}.${key}` : key
        if (!original.hasOwnProperty(key)) {
            changes.push({ path: currentPath, operation: "add", value: updated[key] })
        } else if (typeof updated[key] === 'object' && updated[key] !== null && typeof original[key] === 'object' && original[key] !== null) {
            changes.push(...diffObject(original[key], updated[key], currentPath))
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

export function seconds(s: number) { return s * 1000 }

export function generateUUID() {
    // Check if we're in a browser or Node.js environment
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        // Browser environment with modern Crypto API
        return window.crypto.randomUUID();
    } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // Browser environment with crypto in global scope
        return crypto.randomUUID();
    } else if (typeof require === 'function') {
        // Node.js environment
        try {
            const crypto = require('crypto');
            return crypto.randomUUID();
        } catch (err) {
            // Fall back to a manual implementation if crypto module fails
            return manualUUID();
        }
    } else {
        // Fallback for environments without crypto support
        return manualUUID();
    }
}

// Fallback manual implementation
function manualUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface ProcessOnlyChangedItemsOptions<Current, Saved, Cache = Map<string, Saved>> {
    currentItems: Current[],
    savedItems: Saved[],
    currentSignature: (currentItem: Current) => string,
    savedSignature: (savedItem: Saved) => string,
    convert: (currentItems: Current[], cache: Cache) => Saved[] | Promise<Saved[]>,

    createCache?: (savedItems: Saved[]) => Cache,
    // refreshCached?: undefined
}

export interface ProcessOnlyChangedItemsOutput<Saved> {
    allItems: Saved[],
    newItems: Saved[],
    // updatedItems: { item: Saved, changes: Change[] }[],
    currentButUnchangedItems: Saved[],
}

export async function processOnlyChangedItems<Current, Saved, Cache = Map<string, Saved>>(options: ProcessOnlyChangedItemsOptions<Current, Saved, Cache>): Promise<ProcessOnlyChangedItemsOutput<Saved>> {
    const { currentItems, savedItems, currentSignature, savedSignature, convert, createCache } = options
    
    const savedSignatures = new Map(savedItems.map(si => [savedSignature(si), si]))
    const [newItems, unchangedItems] = currentItems.reduce<[Current[], Saved[]]>((acc, curr) => {
        const signature = currentSignature(curr)
        if (savedSignatures.has(signature)) {
            acc[1].push(savedSignatures.get(signature)!)
        } else {
            acc[0].push(curr)
        }
        return acc
    }, [[], []])

    const cache: Cache = createCache ? createCache(savedItems) : savedSignature as Cache

    const processedItems: Saved[] = await convert(newItems, cache)
    return {
        allItems: [...savedItems, ...processedItems],
        newItems: processedItems,
        currentButUnchangedItems: unchangedItems,
    }

}