import { flatten, unflatten } from "flat";
import { Cell, Row, Store, Table } from "tinybase";
import { loadCellAndListen, loadRowAndListen } from "./demo-utils";
import { GoogleCredentials, GoogleDriveExtension, GoogleDriveFile, GoogleDriveFileOptions } from "./extensions/googledrive";
import { seconds, Stream } from "./stream";

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
        .filterType(t => isGoogleCredentials(t))
    const storedToken = Stream
        .listener<Row | undefined>(emit => loadRowAndListen(secureStore, "auth", "google-drive", emit))
        .map(t => t as unknown)
        .filterType(t => isGoogleCredentials(t))

    const token = Stream.or(exchangeCodeForToken, storedToken)
        .filterType(t => !!t)

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
        .onEach(files => {
            const flattened = Object.fromEntries(files.data.map(f => [f.id, flatten(f)])) as Table
            // console.log("flattened: ", flattened)
            serverStore.setTable("google-drive", flattened)

            const [additions, updates, deletions] = files.changes.reduce(([a, u, d], c) => {
                if(c.operation === "add") return [[...a, c.value], u, d]
                if(c.operation === "update") return [a, [...u, c.value], d]
                if(c.operation === "delete") return [a, u, [...d, c.value]]
                return [a, u, d]
            }, [[], [], []] as [GoogleDriveFile[], GoogleDriveFile[], GoogleDriveFile[]])

            console.log("Additions: ", additions, "Updates: ", updates, "Deletions: ", deletions)

            const additionsAsNotes: [string, any][] = additions.map(asNote)
            const updatesAsNotes: [string, any][] = updates.map(asNote)
            sharedStore.transaction(() => {
                additionsAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
                updatesAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
                deletions.forEach(p => sharedStore.delRow("notes", p.id))
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