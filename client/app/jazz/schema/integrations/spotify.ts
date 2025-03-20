import { CoMap, co, CoList, FileStream } from "jazz-tools";
import { Integration } from "../integrations";
import { AccessToken, SimplifiedPlaylist } from "@spotify/web-api-ts-sdk";
import { CoOf } from "../../utils";
import { cojson } from "../../test";
import { FullSpotifyPlaylist } from "aqueduct";

export class SpotifyIntegration extends Integration {
    authentication = co.optional.json<AccessToken>();
    playlists = co.optional.ref(CoList.Of(cojson.json<FullSpotifyPlaylist>()))
}

export class ImageList extends CoList.Of(FileStream) {}
export class SpotifyPlaylist extends CoMap {
    collaborative = co.boolean;
    description = co.string;
    external_urls = co.ref(ExternalUrls);
    followers = co.json<{
        href: string | null;
        total: number;
    }>();
    href = co.string;
    _id = co.string;
    images = co.ref(ImageList);
    name = co.string;
    owner = co.ref(UserReference);
    primary_color = co.string;
    public = co.boolean;
    snapshot_id = co.string;
    type = co.string;
    uri = co.string;
    // tracks = co.ref(TrackList);
}

export class ExternalUrls extends CoMap {
    spotify = co.string;
}
export class UserReference extends CoMap {
    display_name = co.string;
    external_urls = ExternalUrls;
    href = co.string;
    _id = co.string;
    type = co.string;
    uri = co.string;
}

export type SpotifyPlaylistTest = CoOf<SimplifiedPlaylist>