import { Integration, SyncFlow } from "../integrations"
import { GoogleCredentials, GoogleDriveFile, GoogleLocationHistoryItem, RawGoogleLocationHistoryItem } from "aqueduct"
import { co, CoMap, CoList, FileStream } from "jazz-tools"
import { cojson } from "../../test"

export class GoogleAuthentication extends CoMap {
    code = co.optional.string
    credentials = co.optional.json<GoogleCredentials>()
}
export class LocationHistory extends SyncFlow {
    items = co.ref(LocationHistoryList)
    fileInProcess = co.optional.json<RawGoogleLocationHistoryItem[]>()
}
export class LocationHistoryList extends CoList.Of(cojson.json<GoogleLocationHistoryItem>()) {}
export class FileList extends CoList.Of(cojson.json<GoogleDriveFile>()) {}
export class GoogleIntegration extends Integration {
    authentication = co.ref(GoogleAuthentication)
    files = co.ref(FileList)
    locations = co.ref(LocationHistory)
}