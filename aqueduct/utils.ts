import { ZipEntry, unzip } from "unzipit"

export function seconds(s: number) { return s * 1000 }

export async function unzipFile(file: File | ArrayBuffer) { return unzipFiles([file] as File[] | ArrayBuffer[]) }
export async function unzipFiles(files: File[] | ArrayBuffer[]): Promise<{ [key: string]: ZipEntry }> {
    const buffers = files[0] instanceof ArrayBuffer ? (files as ArrayBuffer[]) : await Promise.all((files as File[]).map(f => f.arrayBuffer()))
    const zips = await Promise.all(buffers.map(async b => await unzip(b)))
    const allEntries: { [key: string]: ZipEntry } = zips.reduce((acc, zi) => { return {...acc, ...zi.entries } }, {})

    return allEntries
}

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

export interface FetchDiffOptions<Current, Saved, Cache = Map<string, Saved>, Identifier = string, Signature = Identifier> {
    currentItems: Current[],
    savedItems: Saved[],
    currentIdentifier: (currentItem: Current) => Identifier,
    savedIdentifier: (savedItem: Saved) => Identifier,
    currentSignature?: (currentItem: Current) => Signature,
    savedSignature?: (savedItem: Saved) => Signature,
    convert: FetchDiffConvert<Current, Saved, Cache>,
    createCache?: (savedItems: Saved[]) => Cache,
    keepStaleItems: boolean | ((staleItem: Saved, nonStaleItems: Saved[]) => boolean),
    // refreshCached?: undefined
}

//TODO: decide if I want to add Identifier and Signature params back
export type FetchDiffConvert<Current, Saved, Cache> = FetchDiffConvertAll<Current, Saved, Cache> | FetchDiffConvertEach<Current, Saved, Cache>
export interface FetchDiffConvertAll<Current, Saved, Cache> {
    all: (currentChangedItems: Current[], cache: Cache) => Saved[] | Promise<Saved[]>,
}
export interface FetchDiffConvertEach<Current, Saved, Cache> {
    each: (currentChangedItem: Current, cache: Cache) => Saved | Promise<Saved>,
}

export interface FetchDiffOutput<Saved> {
    allItems: Saved[],
    newItems: Saved[],
    updatedItems: Saved[],
    // updatedItems: { item: Saved, changes: Change[] }[],
    unchangedItems: Saved[],
    keptStaleItems: Saved[],
    removedItems: Saved[],
}

export async function fetchDiff<Current, Saved, Cache = Map<string, Saved>, Identifier = string, Signature = Identifier>(options: FetchDiffOptions<Current, Saved, Cache, Identifier, Signature>): Promise<FetchDiffOutput<Saved>> {
    const { currentItems, savedItems, currentIdentifier, savedIdentifier, currentSignature = currentIdentifier, savedSignature = savedIdentifier, convert, createCache, keepStaleItems } = options
    
    const savedIdentifiers = new Map(savedItems.map(si => [savedIdentifier(si), si]))
    const savedSignatures = new Map(savedItems.map(si => [savedSignature(si), si]))
    const [changedItems, unchangedItems] = currentItems.reduce<[Current[], Saved[]]>((acc, curr) => {
        const signature = currentSignature(curr)
        if (savedSignatures.has(signature)) {
            acc[1].push(savedSignatures.get(signature)!)
        } else {
            acc[0].push(curr)
        }
        return acc
    }, [[], []])

    const cache: Cache = createCache ? createCache(savedItems) : savedSignature as Cache
    const processedItems: Saved[] = ("each" in convert)
        ? await Promise.all(changedItems.map(item => {
            const ps: Promise<Saved> = Promise.resolve(convert.each(item, cache)) //TODO: error handling
            return ps
        }))
        : await Promise.resolve(convert.all(changedItems, cache)).catch(err => console.error("Error converting items", err)) ?? []   

    const [newItems, updatedItems] = processedItems.reduce<[Saved[], Saved[]]>((acc, i) => {
        const identifier = savedIdentifier(i)
        if (savedIdentifiers.has(identifier)) {
            acc[1].push(i)
        } else {
            acc[0].push(i)
        }
        return acc
    }, [[], []])

    const allNonStaleItems = [...newItems, ...updatedItems, ...unchangedItems]
    const allNonStaleIdentifiers = allNonStaleItems.map(i => savedIdentifier(i))
    const allStaleItems = savedItems.filter(i => !allNonStaleIdentifiers.includes(savedIdentifier(i)))

    const [removedItems, keptStaleItems] = 
        keepStaleItems === true ? [[], allStaleItems]
        : keepStaleItems === false ? [allStaleItems, []]
        : allStaleItems.reduce<[Saved[], Saved[]]>((acc, i) => {
            if (keepStaleItems(i, allNonStaleItems)) {
                acc[1].push(i)
            } else {
                acc[0].push(i)
            }
            return acc
        }, [[], []])

    return {
        allItems: [...allNonStaleItems, ...keptStaleItems],
        newItems: newItems,
        updatedItems: updatedItems,
        unchangedItems: unchangedItems,
        keptStaleItems: keptStaleItems,
        removedItems: removedItems,
    }
}

export interface FetchWindowedOptions<In, Out> {
    items: In[],
    windowSize: number,
    fetch: (items: In[]) => Promise<Out[]>,
    // parallel?: number | null, TODO: use p-limit or in-house to parallelize
    parallel?: boolean,
    onProgress?: (progress: number) => void,
}

export async function fetchWindowed<In, Out>(options: FetchWindowedOptions<In, Out>): Promise<Out[]> {
    const { items, windowSize, fetch, parallel = false, onProgress } = options

    const windowed = items.reduce<In[][]>((acc, item, index) => {
        const windowIndex = Math.floor(index / windowSize)
        if (!acc[windowIndex]) {
            acc[windowIndex] = []
        }
        acc[windowIndex].push(item)
        return acc
    }, [])

    if(parallel) {
        let numberFetched = 0
        const results = await Promise.all(windowed.map(w => fetch(w).then(res => {
            if(onProgress) onProgress(numberFetched)
            numberFetched += 1
            return res
        })))
        return results.flat()
    } else {
        const results: Out[] = []
        for(let i = 0; i < windowed.length; i++) {
            const result = await fetch(windowed[i])
            results.push(...result)
            if(onProgress) onProgress(i)
        }
        return results
    }
}

//TODO: fetchPaged