import * as google from "googleapis"
import { AutomaticIngestionMethod, Extension, IngestionMethod, OAuthPrereq, SyncInfo } from "../extension";

export class GoogleDriveExtension implements Extension {
    public id = "google-drive"
    public name = "Google Drive"
    public ingestionMethods: IngestionMethod<any, any>[]
    constructor (
        apiIngestion: GoogleDriveAPIIngestion | null = null,
    ) {
        this.ingestionMethods = [apiIngestion].filter(im => im !== null)
    }
}

export interface GoogleDriveAPISyncInfo extends SyncInfo {
    params: google.drive_v3.Params$Resource$Files$List
}
export class GoogleDriveAPIIngestion extends AutomaticIngestionMethod<GoogleOAuthToken, GoogleDriveAPISyncInfo> {
    private oauthClient: google.Auth.OAuth2Client
    private driveAPI: google.drive_v3.Drive
    
    constructor(
        authKeys: { clientID: string, clientSecret: string },
        public onSync: (response: any, id: string) => void,
    ) {
        super()
        this.oauthClient = new google.Auth.OAuth2Client(
            authKeys.clientID,
            authKeys.clientSecret,
        )
        this.driveAPI = new google.drive_v3.Drive({ auth: this.oauthClient })
    }

    id = "google-drive-api"
    public exchangeCodeForToken = (code: string) => {
        return new Promise((resolve, reject) => {
            this.oauthClient.getToken({
                code: code,
                redirect_uri: "https://localhost:3000/auth/google",
            }, (err, token) => {
                if (err) {
                    console.error("Error exchanging code for token: ", JSON.stringify(err, null, 2))
                    reject(err)
                }
                resolve(token)
            })
        })
    }
    public checkAndRefreshToken = (token: GoogleOAuthToken, onRefresh: (newToken: GoogleOAuthToken) => void) => {
        return new Promise((resolve, reject) => {
            // Make a test request that refreshes the token if it's expired
            this.oauthClient.request({ url: "https://www.googleapis.com/drive/v3/files" })
                .then(() => resolve(token))
                .catch((err) => {
                    this.oauthClient.setCredentials(token)
                    this.oauthClient.refreshAccessToken((err, newToken) => {
                        if (err || !newToken || !newToken.access_token || !newToken.refresh_token || !newToken.scope || !newToken.expiry_date) {
                            console.error("Error refreshing token: ", JSON.stringify(err, null, 2))
                            reject(err)
                        } else {
                            onRefresh(newToken as GoogleOAuthToken)
                            resolve(newToken)    
                        }
                    })
                })
        })
    }
    private checkPrereqs = (prereqInfo: GoogleOAuthToken | null) => (prereqInfo) 
        ? new Promise((resolve, reject) => {
            if (!prereqInfo) reject("Google Drive: No token provided")
            this.oauthClient.setCredentials(prereqInfo)
            if (!this.oauthClient.credentials.scope?.split(" ").includes("https://www.googleapis.com/auth/drive.metadata.readonly")) {
                reject(`Google Drive: Token does not have required scope (currently only has ${this.oauthClient.credentials.scope})`)
            }
            resolve(prereqInfo)
        })
        : Promise.reject("Google Drive: No token provided")

    sync = (prereqInfo: GoogleOAuthToken, syncInfo: GoogleDriveAPISyncInfo) => {
        return this.checkPrereqs(prereqInfo)
            .then(() => this.driveAPI.files.list(syncInfo.params))
            .then(r => r.data.files ?? [])
    }
}

export interface GoogleOAuthToken {
    access_token: string,
    refresh_token: string,
    scope: string,
    expiry_date: number,
}
export function isGoogleOAuthToken(token: any): token is GoogleOAuthToken {
    return token && typeof token === "object" && "access_token" in token && "refresh_token" in token && "scope" in token && "expiry_date" in token
}