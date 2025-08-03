import { PlaylistedTrack, SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { FullSpotifyPlaylist, SpotifyListen } from "aqueduct/integrations/spotify";
import { TimelineDurationItem, TimelineItem } from "../timeline";

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


export class SpotifyListenTimelineItem extends TimelineDurationItem {
    static SOURCE = "Spotify"
    static TYPE = "Playlist"

    constructor(
        public listen: SpotifyListen,
    ) {
        super(
            new Date(listen.timestamp).toISOString() + "|" + listen.uri,
            {
                start: new Date(listen.timestamp),
                end: new Date(listen.timestamp + (listen.playInfo?.millisecondsPlayed ?? ("album" in listen.track ? listen.track.duration_ms : 0))),
                color: "#DDF3E4",
                style: "solid",
            },
            "spotify",
            "listen",
            `Played ${"album" in listen.track ? listen.track.name : listen.track.trackName} by ${"album" in listen.track ? listen.track.artists.map(a => a.name).join(", ") : listen.track.artistName}`,
        )
    }
}