import { Playlist, PlaylistedTrack, SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { TimelineItem } from "../timeline";
import { FullSpotifyPlaylist } from "aqueduct";

export class SpotifyPlaylistTimelineItem extends TimelineItem {
    static SOURCE = "Spotify"
    static TYPE = "Playlist"
    
    constructor(
        public playlist: SimplifiedPlaylist,
        public track: PlaylistedTrack<Track>,
        public firstAdd: boolean,
    ) {
        super(
            playlist.id + "|" + track.track.id + "|" + track.added_at,
            new Date(track.added_at),
            SpotifyPlaylistTimelineItem.SOURCE,
            SpotifyPlaylistTimelineItem.TYPE,
            `${track.track.name} added to ${playlist.name}`
        )    
    }

    static playlistToTimelineItems(playlist: FullSpotifyPlaylist): SpotifyPlaylistTimelineItem[] {
        return playlist.fullTracks
            .sort((a, b) => Date.parse(a.added_at) - Date.parse(b.added_at))
            .map((track, i) => {
                return new SpotifyPlaylistTimelineItem(playlist, track, i == 0)
        })
    }
}

