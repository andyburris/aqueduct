import { ExtensionAuth } from "./auth";
import { Input } from "./input";

export interface Extension {
    id: string,
    name: string,
    ingestionMethods: IngestionMethod<any, any>[],
}

export interface IngestionMethod<PI extends PrereqInfo, SI extends SyncInfo> {
    id: string,
    loadPrereqInfo: () => Promise<PI>,
    checkPrereqs: (prereqInfo: PI) => Promise<PI>,
    sync: (prereqInfo: PI, syncInfo: SI) => Promise<any>,
    onSync: (response: any, id: string) => void,
}

export abstract class AutomaticIngestionMethod<PI extends PrereqInfo, SI extends SyncInfo> implements IngestionMethod<PI, SI> {
    abstract loadPrereqInfo: () => Promise<PI>
    abstract loadSyncInfo: () => Promise<SI>
    abstract checkPrereqs: (prereqInfo: PI) => Promise<PI>
    abstract sync: (prereqInfo: PI, syncInfo: SI) => Promise<any>
    abstract onSync: (response: any, id: string) => void
    abstract id: string
    public trySync(): Promise<any> {
        return this.loadPrereqInfo()
        .then(pi => this.checkPrereqs(pi))
        .then(async pi => {
            const si = await this.loadSyncInfo()
            this.sync(pi, si)
        })
    }
}
export abstract class ManualIngestionMethod<PI extends PrereqInfo, SI extends SyncInfo> implements IngestionMethod<PI, SI> {
    abstract loadPrereqInfo: () => Promise<PI>
    abstract checkPrereqs: (prereqInfo: PI) => Promise<PI>
    abstract sync: (prereqInfo: PI, syncInfo: SI) => Promise<any>
    abstract onSync: (response: any, id: string) => void
    abstract id: string
    public trySync(syncInfo: SI): Promise<any> {
        return this.loadPrereqInfo()
        .then(pi => this.checkPrereqs(pi))
        .then(pi => this.sync(pi, syncInfo))
    }
}

export interface PrereqInfo {}
export interface NoPrereq extends PrereqInfo {}
export interface APIKeyPrereq extends PrereqInfo { apiKey: string | null }

export interface SyncInfo {}
export interface NoSyncInfo {}
export interface FileSyncInfo { file: File }