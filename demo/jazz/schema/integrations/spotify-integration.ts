import { AccessToken } from "@spotify/web-api-ts-sdk";
import { FullSpotifyPlaylist } from "aqueduct/extensions/spotify";
import { co, z } from "jazz-tools";
import { cojson } from "../../test";
import { Integration, SyncFlow } from "../integrations";
import { SpotifyListen } from "aqueduct/extensions/spotify/spotify-listen";

export const PlaylistList = co.list(cojson.json<SpotifyListen>())
export const ListensList = co.list(cojson.json<SpotifyListen>())
export const ListeningHistory = co.map({
    ...SyncFlow,
    listens: ListensList,
    fileInProcess: co.fileStream(),
})
export const Playlists = co.map({
    ...SyncFlow,
    items: PlaylistList,
})
export const SpotifyIntegration = co.map({
    ...Integration,
    authentication: cojson.json<AccessToken>().optional(),
    playlists: Playlists,
    listeningHistory: ListeningHistory,
})