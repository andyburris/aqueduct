import * as google from "googleapis"

export type GoogleCredentials = google.Auth.Credentials
export type GoogleDriveFileOptions = google.drive_v3.Params$Resource$Files$List
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
            this.oauthClient.getToken({ code: code, redirect_uri: "https://localhost:3000/auth/google" }, (err, token) => {
                if (err) {
                    console.error("Error exchanging code for token: ", JSON.stringify(err, null, 2))
                    reject(err)
                }
                resolve(token)
            })
        })
    }



    public getFiles(token: GoogleCredentials, options: GoogleDriveFileOptions): Promise<google.drive_v3.Schema$File[]> {
        return new Promise((resolve, reject) => {
            this.oauthClient.setCredentials(token)
            if (!this.oauthClient.credentials.scope?.split(" ").includes("https://www.googleapis.com/auth/drive.metadata.readonly")) {
                reject(`Google Drive: Token does not have required scope (currently only has ${this.oauthClient.credentials.scope})`)
            }
            this.driveAPI.files.list(options, (err, response) => {
                if (err) {
                    console.error("Error getting files: ", JSON.stringify(err, null, 2))
                    reject(err)
                }
                if (!response || !response.data || !response.data.files) {
                    console.error("Error getting files: ", JSON.stringify(response, null, 2))
                    reject(response)
                }
                resolve(response!.data!.files!)
            })
        })
    }
}