import { unzip } from "unzipit";
import { APIKeyPrereq, AutomaticIngestionMethod, Extension, FileSyncInfo, IngestionMethod, ManualIngestionMethod, NoPrereq, NoSyncInfo } from "../extension"
import { FileInput, NoInput } from "../input";
import { NotionAPI } from "notion-client";

const options = {
    method: 'POST',
    body: '{}'
};

export class NotionExtension implements Extension {
    public id = "notion"
    public name = "Notion"
    public ingestionMethods: IngestionMethod<any, any>[]
    constructor (
        apiIngestion: NotionAPIIngestion | null = null,
        exportIngestion: NotionExportIngestion | null = null,
    ) {
        this.ingestionMethods = [apiIngestion, exportIngestion].filter(im => im !== null)
    }
}

export interface NotionAPIKeyPrereq extends APIKeyPrereq {
    activeUserID: string | null
}
export class NotionAPIIngestion extends AutomaticIngestionMethod<NotionAPIKeyPrereq, NoSyncInfo> {
    id = "notion-api"
    loadPrereqInfo = () => this.loadAPIKeys()
    loadSyncInfo = () => Promise.resolve({})

    checkPrereqs = (prereqInfo: NotionAPIKeyPrereq) => (prereqInfo.apiKey && prereqInfo.activeUserID) ? Promise.resolve(prereqInfo) : Promise.reject("Notion: No API key provided")
    sync = (auth: NotionAPIKeyPrereq) => { 
        const notionAPI = new NotionAPI({ 
            apiBaseUrl: "http://localhost:8082/https://www.notion.so/api/v3",
            activeUser: auth.activeUserID!, 
            authToken: auth.apiKey!
        })
        return notionAPI.fetch({
            endpoint: "getSpaces",
            body: {},
            kyOptions: {
                credentials: "include",
            }
        }).then(r => (r as any).json())
        .then(o =>{
            console.log("synced Notion record map")
            console.log(o)
        })
        // return notionAPI.getPage("fd6926949c034fa999f7f2f500bf194c")
        // .then(r => (r as any).json())
        // .then(o =>{
        //     console.log("synced Notion record map")
        //     console.log(o)
        // })
    }
    constructor(
        public loadAPIKeys: () => Promise<NotionAPIKeyPrereq>,
        public onSync: (response: any, id: string) => void
    ) { super() }
}

export class NotionExportIngestion extends ManualIngestionMethod<NoPrereq, FileSyncInfo> {
    id = "notion-export"
    loadPrereqInfo = () => Promise.resolve({})
    checkPrereqs = (prereqInfo: NoPrereq) => Promise.resolve(prereqInfo)
    sync = async (prereqInfo: NoPrereq, syncInfo: FileSyncInfo) => {
        const file = syncInfo.file
        const initialEntries = (await unzip(file)).entries
        console.log("initialEntries = ", initialEntries)
        const isDoubleZipped = Object.values(initialEntries)[0].name.endsWith(".zip")
        const finalEntries = isDoubleZipped
            ? (await unzip(await Object.values(initialEntries)[0].arrayBuffer())).entries
            : initialEntries
        const extracted = Object.entries(finalEntries)
            .filter(([filename]) => filename.endsWith(".md"))
            .map(([filename, zipEntry]) => {
                return zipEntry.text()
                    .then(text => {
                        const breakIndex = text.indexOf('\n')
                        const title = text.slice(2, breakIndex)
                        const withoutTitle = text.slice(breakIndex + 2)
                        return {
                            rawText: text,
                            title: title,
                            text: withoutTitle,
                        }
                    })
            })
        const asJSON = await Promise.all(extracted)
        console.log("asJSON = ", asJSON)

        return asJSON
    }

    constructor(
        public onSync: (response: any, id: string) => void
    ) { super() }
}