// import { Integration, SyncFlow } from "../integrations"
// import { GoogleCredentials, GoogleDriveFile, GoogleLocationHistoryItem, GooglePhotoMetadata, GooglePhotoWithMetadata, RawGoogleLocationHistoryItem } from "aqueduct"
// import { co, CoMap, CoList, FileStream, ImageDefinition } from "jazz-tools"
// import { cojson } from "../../test"

// export class GoogleAuthentication extends CoMap {
//     code = co.optional.string
//     credentials = co.optional.json<GoogleCredentials>()
// }

// export class LocationHistory extends SyncFlow {
//     items = co.ref(LocationHistoryList)
//     fileInProcess = co.optional.json<RawGoogleLocationHistoryItem[]>()
// }
// export class LocationHistoryList extends CoList.Of(cojson.json<GoogleLocationHistoryItem>()) {}

// export class DriveFiles extends SyncFlow {
//     items = co.ref(DriveFileList)
// }
// export class DriveFileList extends CoList.Of(cojson.json<GoogleDriveFile>()) {}

// export class GooglePhotos extends SyncFlow {
//     items = co.ref(GooglePhotosList)
// }
// export class GooglePhoto extends CoMap {
//     photo = co.ref(ImageDefinition)
//     metadata = co.json<GooglePhotoMetadata>()
// }
// export class GooglePhotosList extends CoList.Of(co.ref(GooglePhoto)) {}

// export class GoogleIntegration extends Integration {
//     authentication = co.ref(GoogleAuthentication)
//     files = co.ref(DriveFiles)
//     locations = co.ref(LocationHistory)
//     photos = co.ref(GooglePhotos)
// }