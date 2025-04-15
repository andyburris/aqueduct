import { GoogleCredentials, GoogleDriveExtension, GoogleDriveFile, GoogleDriveFileOptions, Stream, seconds } from "aqueduct";
import { GoogleIntegration } from "../../jazz/schema/integrations/google-integration";

const syncInfo: GoogleDriveFileOptions = {
    pageSize: 50,
    fields: "files(id, name, modifiedTime, createdTime, mimeType)",
    q: "trashed=false",
}

export async function syncDrive(data: GoogleIntegration) {
    console.log("Syncing Google Drive...")

    if(!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID not set")
    if(!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET not set")
    const drive = new GoogleDriveExtension({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })

    const loadedData = await data.ensureLoaded({ resolve: { authentication: {}, files: { items: true } }})

    const code = Stream
        .fromListener<string>(emit => loadedData.authentication.subscribe({}, (auth) => { if(auth.code) emit(auth.code) }))
        // .onEach(c => console.log("Got code: ", c))
        .filter(c => c !== undefined)
    code
        .map(code => drive.exchangeCodeForToken(code))
        .filter(t => isGoogleCredentials(t))
        .listen(async token => {
            loadedData.authentication.credentials = token ?? undefined
            loadedData.authentication.code = undefined
        })

    const storedToken = Stream
        .fromListener<GoogleCredentials | undefined>(emit => loadedData.authentication.subscribe({}, (auth) => { 
            emit(auth.credentials)
        }))

    const token = storedToken
        // .onEach(t => console.log("Got google token: ", t))

    const files = token
        .every(
            seconds(10), 
            loadedData.files.lastSyncStarted?.getTime(), 
            syncedAt => loadedData.files.lastSyncFinished = new Date(syncedAt)
        )
        .filter(t => !!t)
        .map(async token => {
            const previousFiles = loadedData.files.items
            console.log(`getting files with ${previousFiles.length} previous files`)
            return drive.getFiles(token, syncInfo, previousFiles)
        })
 
    files
        .listen(async files => {
            loadedData.files.items.applyDiff(files.allItems)
            loadedData.files.lastSyncFinished = new Date()
        })
}

function isGoogleCredentials(token: any): token is GoogleCredentials {
    return "access_token" in token && "refresh_token" in token && "token_type" in token && "expiry_date" in token && "scope" in token
}