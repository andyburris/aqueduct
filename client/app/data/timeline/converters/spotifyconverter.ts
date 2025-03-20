import { Playlist, PlaylistedTrack, SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { TimelineItem } from "../timeline";
import { FullSpotifyPlaylist } from "aqueduct";

export class SpotifyPlaylistTimelineItem implements TimelineItem {
    static SOURCE = "Spotify"
    static TYPE = "Playlist"

    constructor(
        public playlist: SimplifiedPlaylist,
        public track: PlaylistedTrack<Track>,
        public firstAdd: boolean,
    ) {
    }

    id: string = this.playlist.id + "|" + this.track.track.id + "|" + this.track.added_at
    timestamp: Date = new Date(this.track.added_at)
    source: string = SpotifyPlaylistTimelineItem.SOURCE
    type: string = SpotifyPlaylistTimelineItem.TYPE
    description: string = `${this.track.track.name} added to ${this.playlist.name}`


    static playlistToTimelineItems(playlist: FullSpotifyPlaylist): SpotifyPlaylistTimelineItem[] {
        return playlist.fullTracks
            .sort((a, b) => Date.parse(a.added_at) - Date.parse(b.added_at))
            .map((track, i) => new SpotifyPlaylistTimelineItem(playlist, track, i == 0))
    }
}

