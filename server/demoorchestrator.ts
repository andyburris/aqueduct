import { flatten } from "flat"
import { Cell, Row, Store, Table } from "tinybase"
import { chain, debounce, filter, filterType, onEach, zip } from "./skybridge/chain"
import { GoogleDriveAPIIngestion, GoogleDriveAPISyncInfo, GoogleOAuthToken, isGoogleOAuthToken } from "./skybridge/extensions/googledrive"
import { SupernotesAPIIngestion } from "./skybridge/extensions/supernotes"
import { Orchestrator } from "./skybridge/orchestrator"

function loadCellAndListen(store: Store, tableId: string, rowId: string, cellId: string, listener: (c: Cell | undefined) => void, mutator: boolean = true) {
    const cell = store.getCell(tableId, rowId, cellId)
    listener(cell)
    store.addCellListener(tableId, rowId, cellId, (s, ti, ri, ci, newCell) => listener(newCell), mutator)
}

function loadRowAndListen(store: Store, tableId: string, rowId: string, listener: (c: Row | undefined) => void, mutator: boolean = true) {
    const cell = store.getRow(tableId, rowId)
    listener(cell)
    store.addRowListener(tableId, rowId, (s, ti, ri, newRow) => listener(s.getRow(ti, ri)), mutator)
}

export const orchestratorFromStore = (sharedStore: Store, secureStore: Store) => new Orchestrator([
    {
        ingestionMethod: new SupernotesAPIIngestion(
            (r, extensionId) => {
                console.log("got supernotes response") 
                // console.log("got supernotes response", r) 
                const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
                sharedStore.setTable(extensionId, flattened)

                const notes: [string, any][] = Object.entries(r).map(([k, v]) => {
                    const raw: any = v
                    const note = {
                        id: k,
                        title: raw.data.name,
                        content: raw.data.markup,
                        source: extensionId,
                        timestamp: new Date(raw.data.modified_when).getTime(),
                        editedTimestamp: new Date(raw.data.modified_when).getTime(),
                        createdTimestamp: new Date(raw.data.created_when).getTime(),
                        syncedTimestamp: Date.now(),
                    }
                    return [k, { ...note }]
                })
                sharedStore.transaction(() => notes.forEach(([k, v]) => sharedStore.setRow("notes", k, v)))
                sharedStore.setCell("extensions", "supernotes", "lastSynced", Date.now())
            }
        ),
        setupTriggers: [
            (im) => {
                const lastSynced = chain<Cell | undefined>(listener => loadCellAndListen(sharedStore, "extensions", "supernotes", "lastSynced", listener))
                const apiKey = chain<Cell | undefined>(listener => loadCellAndListen(secureStore, "auth", "supernotes", "apiKey", listener))
                onEach(apiKey, k => sharedStore.setCell("extensions", "supernotes", "authStatus", k ? "authenticated" : "unauthenticated"))

                const loggedIn = filter(apiKey, k => k !== undefined)
                const debounced = debounce(lastSynced, 1000 * 60 * 10)

                onEach(zip(loggedIn, debounced), ([k, l]) => {
                    console.log("Syncing Supernotes...")
                    im.sync({ apiKey: k }, {}).then((r: any) => im.onSync(r, "supernotes"))
                })
            },
        ]
    },
    // new NotionExtension(
    //     new NotionAPIIngestion(
    //         () => {
    //             return new Promise(resolve => {
    //                 setTimeout(() => {
    //                     const apiKey = secureStore.getCell("auth", "notion", "apiKey")
    //                     const activeUser = secureStore.getCell("auth", "notion", "activeUserID")
    //                     resolve({ apiKey: apiKey ? (apiKey as string) : null, activeUserID: activeUser ? (activeUser as string) : null })
    //                 }, 200)
    //             })
    //         },
    //         (r, extensionId) => {
    //             // console.log("got notion response", r) 
    //             const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
    //             sharedStore.setTable(extensionId, flattened)

    //             const notes: [string, any][] = Object.entries(r).map(([k, v]) => {
    //                 const raw: any = v
    //                 const [[pageID, titleBlock], ...contentBlocksList] = (Object.entries(raw.block) as [string, any][])
    //                 const contentBlocks = Object.fromEntries(contentBlocksList)
    //                 // console.log("titleBlock = ", titleBlock)
    //                 // console.log("raw = ", JSON.stringify(raw))
    //                 const title = titleBlockToNoteTitle(titleBlock)
    //                 console.log("title = ", title)
    //                 const note = {
    //                     id: k,
    //                     title: title,
    //                     content: extractPageContent(titleBlock, contentBlocks, raw.collection),
    //                     source: extensionId,
    //                     timestamp: new Date(titleBlock.value.last_edited_time).getTime(),
    //                     createdTimestamp: new Date(titleBlock.value.created_time).getTime(),
    //                     syncedTimestamp: Date.now(),
    //                 }
    //                 return [k, { ...note }]
    //             })

    //             console.log("notes = ", notes)
    //             sharedStore.transaction(() => notes.forEach(([k, v]) => sharedStore.setRow("notes", k, v)))
    //         }
    //     ),
    // ),
    {
        ingestionMethod: new GoogleDriveAPIIngestion(
            {
                clientID: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
                clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "",
            },
            (r: any, extensionId: string) => {
                console.log("got google drive response", r) 
                const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
                sharedStore.setTable(extensionId, flattened)
                sharedStore.setCell("extensions", "google-drive", "lastSynced", Date.now())
            }
        ),
        setupTriggers: [
            (im) => {
                const code = chain(listener => loadCellAndListen(secureStore, "auth", "google-drive", "code", listener))
                onEach(filterType(code, c => c !== undefined), c => {
                    sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticating")
                    im.exchangeCodeForToken(c as string).then((t: any) => {
                        console.log("received token", t)
                        secureStore.setPartialRow("auth", "google-drive", t)
                        secureStore.delCell("auth", "google-drive", "code")
                        sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticated")
                    }).catch((e: any) => {
                        console.error("Error exchanging code for token: ", e)
                        sharedStore.setCell("extensions", "google-drive", "authStatus", "error")
                    })
                })
            },
            (im) => {
                const syncInfo: GoogleDriveAPISyncInfo = {
                    params: {
                        pageSize: 10,
                        fields: "files(id, name, modifiedTime)",
                    }
                }
                const token = chain<Row | undefined>(listener => loadRowAndListen(secureStore, "auth", "google-drive", listener))
                const lastSynced = chain(listener => loadCellAndListen(sharedStore, "extensions", "google-drive", "lastSynced", listener))

                const loggedIn = filterType(token, t => isGoogleOAuthToken(t))
                const debounced = debounce(lastSynced, 1000 * 60 * 10)

                onEach(zip(loggedIn, debounced), ([t, l]) => {
                    console.log("Syncing Google Drive...")
                    console.log("Google Drive token = ", t)
                    im.checkAndRefreshToken(t as any, (newToken: GoogleOAuthToken) => secureStore.setPartialRow("auth", "google-drive", newToken as any))
                    // Promise.resolve(t)
                    .then((t: GoogleOAuthToken) => im.sync(t, syncInfo))
                    .then((r: any) => im.onSync(r, "google-drive"))
                    .catch((e: any) => {
                        console.error("Error syncing Google Drive: ", e)
                        secureStore.setCell("extensions", "google-drive", "authStatus", "error")
                    })
                })
            }
        ]
    }
])

function titleBlockToNoteTitle(titleBlock: any): string {
    const title: string = titleBlock.value.properties.title[0][0]
    if(!titleBlock.value.format.page_icon) return `${title}`

    const icon: string = titleBlock.value.format.page_icon
    if(icon.includes("://")) return `![${title} icon](${icon}) ${title}`
    else return `${icon} ${title}`
}
function extractPageContent(titleBlock: any, blocks: { [k: string]: any }, collections: { [k: string]: any }): string {
    const blockList: any[] = Object.values(blocks)
    const blocksWithPageParent: any[] = titleBlock.value.content.map((c: string) => blocks[c])
    return blocksWithPageParent.map(b => extractBlockContent(b, blocks, collections)).join("\n")
}
function extractBlockContent(block: any, allBlocks: { [k: string]: any }, allCollections: { [k: string]: any }): string {
    const type: string = block.value.type
    const contents: string[] = block.value.content
    if (type === "page") {
        const icon = block.value.format.page_icon ? `${block.value.format.page_icon} ` : ""
        const title = block.value.properties.title[0][0]
        const id = block.value.id
        return `[${titleBlockToNoteTitle(block)}](${id})`
    } else if (type === "collection_view_page") {
        const icon = block.value.format.page_icon ? `${block.value.format.page_icon} ` : ""
        const collectionID = block.value.collection_id
        const collection = allCollections[collectionID]
        const title = collection.value.name[0][0]
        const id = block.value.id
        return `[${icon}${title}](${id})`
    } else if (type === "alias") {
        const aliasID = block.value.format.alias_pointer.id
        const aliasedBlock = allBlocks[aliasID]
        if(!aliasedBlock) return "PERMISSION DENIED"
        const content = extractBlockContent(aliasedBlock, allBlocks, allCollections)
        return `${content}↗`
    } else if (contents) {
        const contentText = contents.map((c: string) => {
            const block = allBlocks[c]
            return extractBlockContent(block, allBlocks, allCollections)
        })
        return contentText.join("\n")
    } else if (block.value.properties?.title) {
        return block.value.properties.title[0][0]
    } else {
        return ""
    }
}