import { Integration } from "../integrations"
import { GoogleCredentials, GoogleDriveFile, GoogleLocationHistoryItem } from "aqueduct"
import { co, CoMap, CoList } from "jazz-tools"
import { cojson } from "../../test"

export class GoogleAuthentication extends CoMap {
    code = co.optional.string
    credentials = co.optional.json<GoogleCredentials>()
}
export class LocationHistory extends CoList.Of(cojson.json<GoogleLocationHistoryItem>()) {}
export class FileList extends CoList.Of(cojson.json<GoogleDriveFile>()) {}
export class GoogleIntegration extends Integration {
    authentication = co.ref(GoogleAuthentication)
    files = co.ref(FileList)
    locations = co.ref(LocationHistory)
}