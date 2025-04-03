import { GoogleCredentials, GoogleDriveExtension, GoogleDriveFile, GoogleDriveFileOptions, Stream, seconds } from "aqueduct";
import { GoogleIntegration } from "../../jazz/schema/integrations/google-integration";

const syncInfo: GoogleDriveFileOptions = {
    pageSize: 50,
    fields: "files(id, name, modifiedTime, createdTime)",
    q: "trashed=false",
}

export async function syncDrive(data: GoogleIntegration) {
    console.log("Syncing Google Drive...")

    if(!process.env.GOOGLE_DRIVE_CLIENT_ID) throw new Error("GOOGLE_DRIVE_CLIENT_ID not set")
    if(!process.env.GOOGLE_DRIVE_CLIENT_SECRET) throw new Error("GOOGLE_DRIVE_CLIENT_SECRET not set")
    const drive = new GoogleDriveExtension({
        clientID: process.env.GOOGLE_DRIVE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
    })

    const loadedData = await data.ensureLoaded({ resolve: { authentication: {}, files: true }})

    const code = Stream
        .fromListener<string>(emit => loadedData.authentication.subscribe({}, (auth) => { 
            if(auth.code) emit(auth.code)
        }))
        .map(c => c?.toString())
        .onEach(c => console.log("Got code: ", c))
        .filter(c => c !== undefined)
    code
        .map(code => drive.exchangeCodeForToken(code))
        .filter(t => isGoogleCredentials(t))
        .listen(async token => {
            loadedData.authentication.credentials = token ?? undefined
            loadedData.authentication.code = undefined
        })

    const storedToken = Stream
        .fromListener<GoogleCredentials>(emit => loadedData.authentication.subscribe({}, (auth) => { 
            if(auth.credentials) emit(auth.credentials)
        }))
        .filter(t => isGoogleCredentials(t))

    const token = storedToken
        // .onEach(t => console.log("Got google token: ", t))
        .filter(t => !!t)

    const files = token
        .every(
            seconds(15), 
            data.lastTriedSyncedAt?.getTime(), 
            syncedAt => data.lastTriedSyncedAt = new Date(syncedAt)
        )
        .map(async token => {
            const previousFiles = (await data.ensureLoaded({ resolve: { files: true }})).files
            console.log(`getting files with ${previousFiles.length} previous files`)
            return drive.getFiles(token, syncInfo, previousFiles)
        })
 
    files
        // .onEach(files => sharedStore.setCell("extensions", "google-drive", "files", files))
        .listen(async files => {
            const loaded = await data.ensureLoaded({ resolve: { files: true }})
            loaded.files.applyDiff(files.data)
            data.lastSyncedAt = new Date()
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