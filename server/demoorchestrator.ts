import { flatten } from "flat"
import { Store, Table } from "tinybase"
import { NotionAPIIngestion, NotionExtension } from "./skybridge/extensions/notion"
import { SupernotesAPIIngestion, SupernotesExtension } from "./skybridge/extensions/supernotes"
import { Orchestrator } from "./skybridge/orchestrator"

export const orchestratorFromStore = (store: Store) => new Orchestrator([
    new SupernotesExtension(
        new SupernotesAPIIngestion(
            () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const apiKey = store.getCell("extensions", "supernotes", "apiKey")
                        resolve(apiKey ? (apiKey as string) : null)
                    }, 200)
                })
            },
            (r, extensionId) => {
                // console.log("got supernotes response", r) 
                const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
                store.setTable(extensionId, flattened)

                const notes: Table = Object.fromEntries(Object.entries(r).map(([k, v]) => {
                    const raw: any = v
                    const note = {
                        id: k,
                        title: raw.data.name,
                        content: raw.data.markup,
                        source: extensionId,
                        timestamp: new Date(raw.data.modified_when).getTime(),
                        createdTimestamp: new Date(raw.data.created_wehn).getTime(),
                        syncedTimestamp: Date.now(),
                    }
                    return [k, { ...note }]
                }))
                store.setTable("notes", notes)
            }
        )
    ),
    new NotionExtension(
        new NotionAPIIngestion(
            () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const apiKey = store.getCell("extensions", "notion", "apiKey")
                        const activeUser = store.getCell("extensions", "notion", "activeUserID")
                        resolve({ apiKey: apiKey ? (apiKey as string) : null, activeUserID: activeUser ? (activeUser as string) : null })
                    }, 200)
                })
            },
            (r, extensionId) => {
                // console.log("got notion response", r) 
                const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
                store.setTable(extensionId, flattened)

                const notes: Table = Object.fromEntries(Object.entries(r).map(([k, v]) => {
                    const raw: any = v
                    const [[pageID, titleBlock], ...contentBlocksList] = (Object.entries(raw.block) as [string, any][])
                    const contentBlocks = Object.fromEntries(contentBlocksList)
                    // console.log("titleBlock = ", titleBlock)
                    // console.log("raw = ", JSON.stringify(raw))
                    const title = titleBlockToNoteTitle(titleBlock)
                    console.log("title = ", title)
                    const note = {
                        id: k,
                        title: title,
                        content: extractPageContent(titleBlock, contentBlocks, raw.collection),
                        source: extensionId,
                        timestamp: new Date(titleBlock.value.last_edited_time).getTime(),
                        createdTimestamp: new Date(titleBlock.value.created_time).getTime(),
                        syncedTimestamp: Date.now(),
                    }
                    return [k, { ...note }]
                }))

                console.log("notes = ", notes)
                store.setTable("notes", notes)
            }
        ),
    ),
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