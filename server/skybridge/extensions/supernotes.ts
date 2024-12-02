import { APIKeyPrereq, AutomaticIngestionMethod, Extension, IngestionMethod, NoSyncInfo } from "../extension";

const options = {
    method: 'POST',
    body: '{}'
};

export class SupernotesExtension implements Extension {
    public id = "supernotes"
    public name = "Supernotes"
    public ingestionMethods: IngestionMethod<any, any>[]
    constructor (
        apiIngestion: SupernotesAPIIngestion | null = null,
    ) {
        this.ingestionMethods = [apiIngestion].filter(im => im !== null)
    }
}

export class SupernotesAPIIngestion extends AutomaticIngestionMethod<APIKeyPrereq, NoSyncInfo> {
    id = "supernotes-api"
    loadPrereqInfo = () => this.loadAPIKey().then(k => { return { apiKey: k } })
    loadSyncInfo = () => Promise.resolve({})

    checkPrereqs = (prereqInfo: APIKeyPrereq) => prereqInfo.apiKey ? Promise.resolve(prereqInfo) : Promise.reject("Supernotes: No API key provided")
    sync = (auth: APIKeyPrereq) => { 
        return fetch(
            'https://api.supernotes.app/v1/cards/get/select',
            { 
                headers: {'Api-Key': auth.apiKey!, 'Content-Type': 'application/json'},
                ...options
            }
        )
            // .then(response => new Promise<Response>(resolve => setTimeout(() => resolve(response), 5000)))
            .then(response => response.json())
            .catch(err => console.error(err));              
    }
    constructor(
        public loadAPIKey: () => Promise<string | null>,
        public onSync: (response: any, id: string) => void
    ) { super() }
}