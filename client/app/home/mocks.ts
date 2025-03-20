import { PlaylistedTrack, Track, SimplifiedPlaylist, ExternalUrls, SimplifiedAlbum, SimplifiedArtist, ExternalIds } from "@spotify/web-api-ts-sdk"
import { FullSpotifyPlaylist } from "aqueduct"

export const MOCK_PLAYLISTS: FullSpotifyPlaylist[] = [
    { 
        ...mockPlaylist("Liked Songs", 4),
        fullTracks: [
            mockTrack("Uber Everywhere", ["MadeinTYO", "Travis Scott"], new Date(2017, 1, 17, 15, 34)),
            mockTrack("beibs in the trap", ["Travis Scott", "NAV"], new Date(2016, 7, 10, 11, 21)),
        ],
    },
    {
        ...mockPlaylist("House", 4),
        fullTracks: [
            mockTrack("Temptation", ["Jess Bays", "Poppy Baskcomb"], new Date(2024, 6, 23, 2, 51)),
            mockTrack("girl$", ["Dom Dolla"], new Date(2024, 5, 12, 10, 32)),
            mockTrack("Delilah", ["Fred Again"], new Date(2024, 5, 12, 10, 32)),
            mockTrack("Ocean", ["Fisher", "AR/CO"], new Date(2024, 5, 12, 10, 32)),
        ],

    }
]

function mockTrack(name: string, artists: string[], addedAt: Date): PlaylistedTrack<Track> {
    return {
        added_at: addedAt.toISOString(),
        added_by: {
            external_urls: { spotify: "" },
            href: "",
            id: "test-user",
            type: "",
            uri: "",
        },
        is_local: false,
        primary_color: "blue",
        track: {
            artists: artists.map(a => { return { name: a, id: a.toLowerCase() } as unknown as SimplifiedArtist }),
            available_markets: ["en"],
            disc_number: 1,
            duration_ms: 300000,
            episode: false,
            explicit: true,
            external_urls: {} as unknown as ExternalUrls,
            href: "",
            id: name.toLowerCase(),
            is_local: false,
            name: name,
            preview_url: null,
            track: true,
            track_number: 1,
            type: "",
            uri: "",
            external_ids: {} as unknown as ExternalIds,
            album: {} as unknown as SimplifiedAlbum,
            popularity: 100,
        }
    }
}

function mockPlaylist(name: string, numTracks: number): SimplifiedPlaylist {
    return {
        name: name,
        tracks: {
            href: "",
            total: numTracks,
        },
        collaborative: true,
        description: "",
        external_urls: { spotify: "" },
        followers: { href: "", total: 0 },
        href: "",
        id: "",
        images: [{ url: "", height: 512, width: 512 }],
        owner: {
            display_name: "Test User",
            external_urls: { spotify: "" },
            href: "",
            id: "test-user",
            type: "",
            uri: "",
        },
        primary_color: "blue",
        public: true,
        snapshot_id: "kjsad889hfsad",
        type: "playlist",
        uri: "",
    }
}