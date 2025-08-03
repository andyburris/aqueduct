export interface FetchDiffOptions<Current, Stored, Identifier = string, Signature = Identifier, Cache = Map<Signature, Stored>> {
    currentItems: Current[],
    storedItems: Stored[],
    currentIdentifier: (currentItem: Current) => Identifier,
    storedIdentifier: (storedItem: Stored) => Identifier,
    compareIdentifiers?: (currentIdentifier: Identifier, storedIdentifier: Identifier) => boolean,
    keepStaleItems: boolean | ((staleItems: Stored[], nonStaleItems: Stored[]) => Stored[]),
    convert: FetchDiffConvert<Current, Stored, Cache>,
    currentSignature?: (currentItem: Current) => Signature,
    storedSignature?: (storedItem: Stored) => Signature,
    compareSignatures?: (currentSignature: Signature, storedSignature: Signature) => boolean,
    createCache?: (storedItems: Stored[]) => Cache,
    // refreshCached?: undefined
}

//TODO: decide if I want to add Identifier and Signature params back
export type FetchDiffConvert<Current, Stored, Cache> = FetchDiffConvertAll<Current, Stored, Cache> | FetchDiffConvertEach<Current, Stored, Cache>
export interface FetchDiffConvertAll<Current, Stored, Cache> {
    all: (currentChangedItems: Current[], cache: Cache, correspondingStoredItems: (Stored | undefined)[]) => Stored[] | Promise<Stored[]>,
}
export interface FetchDiffConvertEach<Current, Stored, Cache> {
    each: (currentChangedItem: Current, cache: Cache, correspondingStoredItem?: Stored) => Stored | Promise<Stored>,
}

export interface FetchDiffOutput<Stored> {
    allItems: Stored[],
    newItems: Stored[],
    updatedItems: Stored[],
    // updatedItems: { item: Stored, changes: Change[] }[],
    unchangedItems: Stored[],
    keptStaleItems: Stored[],
    removedItems: Stored[],
}

export async function fetchDiff<Current, Stored, Identifier = string, Signature = Identifier, Cache = Map<Signature, Stored>,>(options: FetchDiffOptions<Current, Stored, Identifier, Signature, Cache>): Promise<FetchDiffOutput<Stored>> {
    const { currentItems, storedItems, currentIdentifier, storedIdentifier, currentSignature = currentIdentifier, storedSignature = storedIdentifier, convert, createCache, keepStaleItems } = options
    //TODO: signature shouldn't default to identifier--means that items with differing data can never get reconciled if they don't have a unique signature
    // maybe shouldn't have identifier have to be part of signature, just for differentiating versions

    const storedIdentifierList = storedItems.map(si => storedIdentifier(si))
    const storedIdentifiers = new Map(storedItems.map((si, i) => [storedIdentifierList[i], si]))
    const storedSignatures = new Map(storedItems.map(si => [storedSignature(si), si]))
    const [changedItems, unchangedItems] = currentItems.reduce<[Current[], Stored[]]>((acc, curr) => {
        const signature = currentSignature(curr)
        if (storedSignatures.has(signature)) {
            acc[1].push(storedSignatures.get(signature)!)
        } else {
            acc[0].push(curr)
        }
        return acc
    }, [[], []])

    const correspondingStoredItems = changedItems.map(curr => storedItems[storedIdentifierList.indexOf(currentIdentifier(curr)) ?? -1])
    const cache: Cache = createCache ? createCache(storedItems) : storedSignature as Cache
    const processedItems: Stored[] = ("each" in convert)
        ? await Promise.all(changedItems.map((item, i) => {
            const ps: Promise<Stored> = Promise.resolve(convert.each(item, cache, correspondingStoredItems[i])) //TODO: error handling
            return ps
        }))
        : await Promise.resolve(convert.all(changedItems, cache, correspondingStoredItems)).catch(err => console.error("Error converting items", err)) ?? []   

    const [newItems, updatedItems] = processedItems.reduce<[Stored[], Stored[]]>((acc, i) => {
        const identifier = storedIdentifier(i)
        if (storedIdentifiers.has(identifier)) {
            acc[1].push(i)
        } else {
            acc[0].push(i)
        }
        return acc
    }, [[], []])

    const allNonStaleItems = [...newItems, ...updatedItems, ...unchangedItems]
    const allNonStaleIdentifiers = allNonStaleItems.map(i => storedIdentifier(i))
    const allStaleItems = storedItems.filter(i => !allNonStaleIdentifiers.includes(storedIdentifier(i)))

    const [removedItems, keptStaleItems] = 
        keepStaleItems === true ? [[], allStaleItems]
        : keepStaleItems === false ? [allStaleItems, []]
        // Promise keeps this a single expression, no legitimate reason to use it
        : await Promise
            .resolve(keepStaleItems(allStaleItems, allNonStaleItems))
            .then(keptStaleItems => [keptStaleItems, allStaleItems.filter(i => !keptStaleItems.includes(i))])

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
    // parallel?: number | null, TODO-LATER: use p-limit or in-house to parallelize
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

export interface FetchPagedOptions<T> {
    initialPage: Promise<T>,
    shouldGetNextPage: (t: T) => boolean,
    getNextPage: (t: T, pageNumber: number) => Promise<T>,
}
export async function fetchPaged<T>(options: FetchPagedOptions<T>) {
    const { initialPage, shouldGetNextPage, getNextPage } = options

    const pages: T[] = []
    let page = await initialPage
    pages.push(page)

    while(shouldGetNextPage(page)) {
        page = await getNextPage(page, pages.length)
        pages.push(page)
    }

    return pages
}