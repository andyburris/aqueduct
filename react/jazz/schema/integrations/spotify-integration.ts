import { AccessToken } from "@spotify/web-api-ts-sdk";
import { FullSpotifyPlaylist } from "aqueduct";
import { co, CoList } from "jazz-tools";
import { cojson } from "../../test";
import { Integration } from "../integrations";

export class PlaylistList extends CoList.Of(cojson.json<FullSpotifyPlaylist>()) {}
export class SpotifyIntegration extends Integration {
    authentication = co.optional.json<AccessToken>()
    playlists = co.ref(PlaylistList)
}