import { Cell, Row, Store } from "tinybase";
import { Stream } from "./hotstream";
import { loadCellAndListen, loadRowAndListen } from "./demo-utils";
import { GoogleCredentials, GoogleDriveExtension, GoogleDriveFileOptions } from "./extensions/googledrive";

const syncInfo: GoogleDriveFileOptions = {
    pageSize: 10,
    fields: "files(id, name, modifiedTime)",
}

export function driveDemo(secureStore: Store, sharedStore: Store) {
    const drive = new GoogleDriveExtension({
        clientID: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "",
    })

    const code = Stream
        .listener<Cell | undefined>(emit => loadCellAndListen(secureStore, "auth", "google-drive", "code", emit))
        .map(c => c?.toString())
        .filterType(c => c !== undefined)
    const exchangeCodeForToken = code
        .onEach(() => sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticating"))
        .map(code => drive.exchangeCodeForToken(code))
        .onEach(token => {
            secureStore.setPartialRow("auth", "google-drive", token as any)
            secureStore.delCell("auth", "google-drive", "code")
            sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticated")
        })
    const storedToken = Stream
        .listener<Row | undefined>(emit => loadRowAndListen(secureStore, "auth", "google-drive", emit))
        .filterType(c => c !== undefined)
        .map(c => c as GoogleCredentials | null | undefined)

    const token = Stream.or(exchangeCodeForToken, storedToken)
        .filterType(c => !!c)

    const files = token
        .map(token => drive.getFiles(token, syncInfo))
 
    files
        // .onEach(files => sharedStore.setCell("extensions", "google-drive", "files", files))
        .onEach(files => console.log('Got files:', files))
}