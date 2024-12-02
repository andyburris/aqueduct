import { flatten } from "flat"
import { Store, Table } from "tinybase"
import { NotionAPIIngestion, NotionExportIngestion, NotionExtension } from "./skybridge/extensions/notion"
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
                console.log("got supernotes response", r) 
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
                console.log("got notion response", r) 
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
                // store.setTable("notes", notes)
            }
        ),
        new NotionExportIngestion(
            (r, extensionId) => {
                console.log("got notion response", r) 
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
                // store.setTable("notes", notes)
            }
        )
    ),
])
