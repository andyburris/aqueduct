import { AccessToken } from "@spotify/web-api-ts-sdk";
import { FullSpotifyPlaylist } from "aqueduct";
import { co, CoList, CoMap, FileStream } from "jazz-tools";
import { cojson } from "../../test";
import { Integration, SyncFlow } from "../integrations";
import { SpotifyListen } from "aqueduct/extensions/spotify/spotify-listen";

export class Playlists extends SyncFlow {
    items = co.ref(PlaylistList)
}
export class PlaylistList extends CoList.Of(cojson.json<FullSpotifyPlaylist>()) {}
export class ListeningHistory extends SyncFlow {
    listens = co.ref(ListensList)
    fileInProcess = co.optional.ref(FileStream)
}
export class ListensList extends CoList.Of(cojson.json<SpotifyListen>()) {}
export class SpotifyIntegration extends Integration {
    authentication = co.optional.json<AccessToken>()
    playlists = co.ref(Playlists)
    listeningHistory = co.ref(ListeningHistory)
}