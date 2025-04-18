import * as google from "googleapis"
import { fetchDiff, FetchDiffOutput } from "../../fetch"

export type GoogleCredentials = google.Auth.Credentials
export type GoogleDriveFileOptions = google.drive_v3.Params$Resource$Files$List
export type GoogleDriveFile = google.drive_v3.Schema$File
export class GoogleDriveExtension {
    private oauthClient: google.Auth.OAuth2Client
    private driveAPI: google.drive_v3.Drive
    
    constructor(
        authKeys: { clientID: string, clientSecret: string },
    ) {
        this.oauthClient = new google.Auth.OAuth2Client(
            authKeys.clientID,
            authKeys.clientSecret,
        )
        this.driveAPI = new google.drive_v3.Drive({ auth: this.oauthClient })
    }

    public exchangeCodeForToken(code: string): Promise<GoogleCredentials | null | undefined> {
        return new Promise((resolve, reject) => {
            this.oauthClient.getToken({ code: code, redirect_uri: "http://localhost:5173/auth/google" }, (err, token) => {
                if (err) {
                    console.error("Error exchanging code for token: ", JSON.stringify(err, null, 2))
                    reject(err)
                }
                resolve(token)
            })
        })
    }

    public async getFiles(token: GoogleCredentials, options: GoogleDriveFileOptions, previous?: GoogleDriveFile[]): Promise<FetchDiffOutput<GoogleDriveFile>> {
        this.oauthClient.setCredentials(token)
        if (!this.oauthClient.credentials.scope?.split(" ").includes("https://www.googleapis.com/auth/drive.metadata.readonly")) {
            throw new Error(`Google Drive: Token does not have required scope (currently only has ${this.oauthClient.credentials.scope})`)
        }

        const files: GoogleDriveFile[] = await new Promise((resolve, reject) => {
            this.driveAPI.files.list(options, (err, response) => {
                if (err) {
                    console.error("Error getting files: ", JSON.stringify(err, null, 2))
                    reject(err)
                    return
                }
                if (!response || !response.data || !response.data.files) {
                    console.error("Error getting files: ", JSON.stringify(response, null, 2))
                    reject(response)
                    return
                }
                resolve(response.data.files)
            })
        })

        return await fetchDiff({
            currentItems: files,
            storedItems: previous ?? [],
            currentIdentifier: (file) => file.id!,
            storedIdentifier: (file) => file.id!,
            keepStaleItems: false,
            convert: { each: (file) => file },
        })
    }

    public async getFileContent(token: GoogleCredentials, file: GoogleDriveFile): Promise<ArrayBuffer> {
        this.oauthClient.setCredentials(token)
        if (!this.oauthClient.credentials.scope?.split(" ").includes("https://www.googleapis.com/auth/drive.readonly")) {
            throw new Error(`Google Drive: Token does not have required scope (currently only has ${this.oauthClient.credentials.scope})`)
        }

        const response = await this.driveAPI.files.get({ fileId: file.id!, alt: "media" }, { responseType: "arraybuffer" })
        return response.data as ArrayBuffer
    }
    public getFilesContent(token: GoogleCredentials, files: GoogleDriveFile[]): Promise<ArrayBuffer[]> {
        return Promise.all(files.map(file => this.getFileContent(token, file))).catch(err => {
            console.error("Error getting files content: ", err)
            throw err
        })
    }
}