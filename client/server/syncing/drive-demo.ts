import { flatten, unflatten } from "flat";
import { Cell, Row, Store, Table } from "tinybase";
import { loadCellAndListen, loadRowAndListen } from "./demo-utils";
import { GoogleCredentials, GoogleDriveExtension, GoogleDriveFile, GoogleDriveFileOptions } from "../../aqueduct/extensions/googledrive";
import { Stream } from "../../aqueduct/stream";
import { seconds } from "../../aqueduct/utils";

const syncInfo: GoogleDriveFileOptions = {
    pageSize: 50,
    fields: "files(id, name, modifiedTime, createdTime)",
    q: "trashed=false",
}

export function syncDrive(secureStore: Store, sharedStore: Store, serverStore: Store) {
    const drive = new GoogleDriveExtension({
        clientID: process.env.GOOGLE_DRIVE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "",
    })

    const code = Stream
        .fromListener<Cell | undefined>(emit => loadCellAndListen(secureStore, "auth", "google-drive", "code", emit))
        .map(c => c?.toString())
        .filter(c => c !== undefined)
    const exchangeCodeForToken = code
        .onEach(() => sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticating"))
        .map(code => drive.exchangeCodeForToken(code))
        .onEach(token => {
            secureStore.setPartialRow("auth", "google-drive", token as any)
            secureStore.delCell("auth", "google-drive", "code")
            sharedStore.setCell("extensions", "google-drive", "authStatus", "authenticated")
        })
        .filter(t => isGoogleCredentials(t))
    const storedToken = Stream
        .fromListener<Row | undefined>(emit => loadRowAndListen(secureStore, "auth", "google-drive", emit))
        .map(t => t as unknown)
        .filter(t => isGoogleCredentials(t))

    const token = Stream.combine(exchangeCodeForToken, storedToken)
        .map(([a, b]) => a || b)
        .filter(t => !!t)

    const files = token
        .every(
            seconds(15), 
            sharedStore.getCell("extensions", "google-drive", "lastTriedSyncedAt") as number | undefined, 
            syncedAt => sharedStore.setCell("extensions", "google-drive", "lastTriedSyncedAt", syncedAt)
        )
        .map(token => {
            const previousFilesTable = serverStore.getTable("google-drive")
            const previousFiles = Object.values(previousFilesTable).map(p => unflatten(p) as GoogleDriveFile)
            return drive.getFiles(token, syncInfo, previousFiles)
        })
 
    files
        // .onEach(files => sharedStore.setCell("extensions", "google-drive", "files", files))
        .listen(files => {
            const flattened = Object.fromEntries(files.data.map(f => [f.id, flatten(f)])) as Table
            // console.log("flattened: ", flattened)
            serverStore.setTable("google-drive", flattened)
            console.log(`Got ${files.changes.additions.length} additions, ${files.changes.updates.length} updates, and ${files.changes.deletions.length} deletions`)

            const additionsAsNotes: [string, any][] = files.changes.additions.map(f => asNote(f.value))
            const updatesAsNotes: [string, any][] = files.changes.updates.map(f => asNote(f.value))
                  sharedStore.transaction(() => {
                additionsAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
                updatesAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
                files.changes.deletions.forEach(f => sharedStore.delRow("notes", f.value.id))
            })

            sharedStore.setCell("extensions", "google-drive", "lastSyncedAt", Date.now())
        })
}

function asNote(file: GoogleDriveFile): [string, any] {
  const note = {
      id: file.id,
      title: file.name,
      content: undefined,
      source: "google-drive",
      timestamp: Date.parse(file.modifiedTime!),
      editedTimestamp: Date.parse(file.modifiedTime!),
      createdTimestamp: Date.parse(file.createdTime!),
      syncedTimestamp: Date.now(),
  }
  return [file.id!, { ...note }]
}

function isGoogleCredentials(token: any): token is GoogleCredentials {
    return "access_token" in token && "refresh_token" in token && "token_type" in token && "expiry_date" in token && "scope" in token
}