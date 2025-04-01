import { Playlist, PlaylistedTrack, SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { TimelineItem } from "../timeline";
import { FullSpotifyPlaylist } from "aqueduct";

export class SpotifyPlaylistTimelineItem implements TimelineItem {
    static SOURCE = "Spotify"
    static TYPE = "Playlist"

    id: string
    timestamp: Date
    source: string
    type: string
    description: string

    
    constructor(
        public playlist: SimplifiedPlaylist,
        public track: PlaylistedTrack<Track>,
        public firstAdd: boolean,
    ) {
        this.id = this.playlist.id + "|" + this.track.track.id + "|" + this.track.added_at
        this.timestamp = new Date(this.track.added_at)
        this.source = SpotifyPlaylistTimelineItem.SOURCE
        this.type = SpotifyPlaylistTimelineItem.TYPE
        this.description = `${this.track.track.name} added to ${this.playlist.name}`
    
    }

    static playlistToTimelineItems(playlist: FullSpotifyPlaylist): SpotifyPlaylistTimelineItem[] {
        return playlist.fullTracks
            .sort((a, b) => Date.parse(a.added_at) - Date.parse(b.added_at))
            .map((track, i) => {
                return new SpotifyPlaylistTimelineItem(playlist, track, i == 0)
        })
    }
}

