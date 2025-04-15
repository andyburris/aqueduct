import * as google from "googleapis"
import { Change, SyncResult, SyncResultChanges } from "../../utils"

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



    public getFiles(token: GoogleCredentials, options: GoogleDriveFileOptions, previous?: GoogleDriveFile[]): Promise<SyncResult<GoogleDriveFile[]>> {
        return new Promise((resolve, reject) => {
            this.oauthClient.setCredentials(token)
            if (!this.oauthClient.credentials.scope?.split(" ").includes("https://www.googleapis.com/auth/drive.metadata.readonly")) {
                reject(`Google Drive: Token does not have required scope (currently only has ${this.oauthClient.credentials.scope})`)
            }
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

                const additions = response.data.files.filter(f => !previous?.find(p => p.id === f.id))
                const updates = response.data.files
                    .filter(f => {
                        const match = previous?.find(p => p.id === f.id)
                        return match && (match.modifiedTime !== f.modifiedTime || match.createdTime !== f.createdTime)
                    })
                const deletions = previous?.filter(p => !response.data.files!.find(f => f.id === p.id))
                const result: SyncResult<GoogleDriveFile[]> = {
                    data: response.data.files,
                    changes: new SyncResultChanges(
                        additions.map(f => ({ operation: "add", value: f } as Change)),
                        updates.map(f => ({ operation: "update", value: f } as Change)),
                        deletions!.map(f => ({ operation: "delete", value: f } as Change)),
                    )
                }
                resolve(result)
            })
        })
    }
}