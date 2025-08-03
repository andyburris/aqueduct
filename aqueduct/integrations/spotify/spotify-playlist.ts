import { z } from "zod"

// Base schemas for common types
export const ExternalUrlsSchema = z.object({
    spotify: z.string(),
}) 

export const FollowersSchema = z.object({
    href: z.string().nullable(),
    total: z.number(),
}) 

export const ImageSchema = z.object({
    url: z.string(),
    height: z.number(),
    width: z.number(),
})

export const SimplifiedArtistSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    name: z.string(),
    type: z.string(),
    uri: z.string(),
})

export const ArtistSchema = SimplifiedArtistSchema.extend({
    followers: FollowersSchema,
    genres: z.array(z.string()),
    images: z.array(ImageSchema),
    popularity: z.number(),
})

export const CopyrightSchema = z.object({
    text: z.string(),
    type: z.string(),
})

export const ExternalIdsSchema = z.object({
    upc: z.string(),
    isrc: z.string(),
    ean: z.string(),
})

export const RestrictionsSchema = z.object({
    reason: z.string(),
})

export const ResumePointSchema = z.object({
    fully_played: z.boolean(),
    resume_position_ms: z.number(),
})

export const LinkedFromSchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    type: z.string(),
    uri: z.string(),
})

// Album schemas
const AlbumBaseSchema = z.object({
    album_type: z.string(),
    available_markets: z.array(z.string()),
    copyrights: z.array(CopyrightSchema),
    external_ids: ExternalIdsSchema,
    external_urls: ExternalUrlsSchema,
    genres: z.array(z.string()),
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    label: z.string(),
    name: z.string(),
    popularity: z.number(),
    release_date: z.string(),
    release_date_precision: z.string(),
    restrictions: RestrictionsSchema.optional(),
    total_tracks: z.number(),
    type: z.string(),
    uri: z.string(),
})

export const SimplifiedAlbumSchema = AlbumBaseSchema.extend({
    album_group: z.string(),
    artists: z.array(SimplifiedArtistSchema),
})

// Track schemas
export const SimplifiedTrackSchema = z.object({
    artists: z.array(SimplifiedArtistSchema),
    available_markets: z.array(z.string()),
    disc_number: z.number(),
    duration_ms: z.number(),
    episode: z.boolean(),
    explicit: z.boolean(),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    is_local: z.boolean(),
    name: z.string(),
    preview_url: z.string().nullable(),
    track: z.boolean(),
    track_number: z.number(),
    type: z.string(),
    uri: z.string(),
    is_playable: z.boolean().optional(),
    linked_from: LinkedFromSchema.optional(),
    restrictions: RestrictionsSchema.optional(),
})

export const TrackSchema = SimplifiedTrackSchema.extend({
    album: SimplifiedAlbumSchema,
    external_ids: ExternalIdsSchema,
    popularity: z.number(),
})

// Note: We need to define TrackItemSchema after EpisodeSchema is defined
// This is a forward reference placeholder - will be defined later

// User and playlist schemas
export const AddedBySchema = z.object({
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    type: z.string(),
    uri: z.string(),
})

export const PlaylistedTrackSchema = z.object({
    added_at: z.string(),
    added_by: AddedBySchema,
    is_local: z.boolean(),
    primary_color: z.string(),
    track: z.lazy(() => z.union([TrackSchema, EpisodeSchema])), // Use lazy for circular reference
})

// Specific schema for when we know it's a Track
export const PlaylistedTrackWithTrackSchema = PlaylistedTrackSchema.extend({
    track: TrackSchema,
})

const PlaylistBaseSchema = z.object({
    collaborative: z.boolean(),
    description: z.string(),
    external_urls: ExternalUrlsSchema,
    followers: FollowersSchema,
    href: z.string(),
    id: z.string(),
})

export const SimplifiedPlaylistSchema = PlaylistBaseSchema.extend({
    images: z.array(ImageSchema),
    name: z.string(),
    owner: z.object({
        display_name: z.string().nullable(),
        external_urls: ExternalUrlsSchema,
        followers: FollowersSchema.optional(),
        href: z.string(),
        id: z.string(),
        images: z.array(ImageSchema).optional(),
        type: z.string(),
        uri: z.string(),
    }),
    primary_color: z.string().nullable(),
    public: z.boolean().nullable(),
    snapshot_id: z.string(),
    tracks: z.object({
        href: z.string(),
        total: z.number(),
    }),
    type: z.string(),
    uri: z.string(),
})

export const PlaylistSchema = PlaylistBaseSchema.extend({
    images: z.array(ImageSchema),
    name: z.string(),
    owner: z.object({
        display_name: z.string().nullable(),
        external_urls: ExternalUrlsSchema,
        followers: FollowersSchema.optional(),
        href: z.string(),
        id: z.string(),
        images: z.array(ImageSchema).optional(),
        type: z.string(),
        uri: z.string(),
    }),
    primary_color: z.string().nullable(),
    public: z.boolean().nullable(),
    snapshot_id: z.string(),
    tracks: z.object({
        href: z.string(),
        items: z.array(PlaylistedTrackSchema),
        limit: z.number(),
        next: z.string().nullable(),
        offset: z.number(),
        previous: z.string().nullable(),
        total: z.number(),
    }),
    type: z.string(),
    uri: z.string(),
})

// Custom schema for FullSpotifyPlaylist - extends the original API type
export const FullSpotifyPlaylistSchema = z.object({
    collaborative: z.boolean(),
    description: z.string(),
    external_urls: ExternalUrlsSchema,
    followers: FollowersSchema,
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    name: z.string(),
    owner: z.object({
        display_name: z.string().nullable(),
        external_urls: ExternalUrlsSchema,
        followers: FollowersSchema.optional(),
        href: z.string(),
        id: z.string(),
        images: z.array(ImageSchema).optional(),
        type: z.string(),
        uri: z.string(),
    }),
    primary_color: z.string().nullable(),
    public: z.boolean().nullable(),
    snapshot_id: z.string(),
    tracks: z.object({
        href: z.string(),
        total: z.number(),
    }).nullable(),
    type: z.string(),
    uri: z.string(),
    fullTracks: z.array(PlaylistedTrackWithTrackSchema),
})

// Episode and Show schemas
export const SimplifiedShowSchema = z.object({
    available_markets: z.array(z.string()),
    copyrights: z.array(CopyrightSchema),
    description: z.string(),
    html_description: z.string(),
    explicit: z.boolean(),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    is_externally_hosted: z.boolean(),
    languages: z.array(z.string()),
    media_type: z.string(),
    name: z.string(),
    publisher: z.string(),
    type: z.string(),
    uri: z.string(),
    total_episodes: z.number(),
})

export const SimplifiedEpisodeSchema = z.object({
    audio_preview_url: z.string(),
    description: z.string(),
    html_description: z.string(),
    duration_ms: z.number(),
    explicit: z.boolean(),
    external_urls: ExternalUrlsSchema,
    href: z.string(),
    id: z.string(),
    images: z.array(ImageSchema),
    is_externally_hosted: z.boolean(),
    is_playable: z.boolean(),
    language: z.string(),
    languages: z.array(z.string()),
    name: z.string(),
    release_date: z.string(),
    release_date_precision: z.string(),
    resume_point: ResumePointSchema,
    type: z.string(),
    uri: z.string(),
    restrictions: RestrictionsSchema,
})

export const EpisodeSchema = SimplifiedEpisodeSchema.extend({
    show: SimplifiedShowSchema,
})

// TrackItem union type - can be either Track or Episode
export const TrackItemSchema = z.union([TrackSchema, EpisodeSchema])

// Export types
export type ExternalUrls = z.infer<typeof ExternalUrlsSchema>
export type Followers = z.infer<typeof FollowersSchema>
export type Image = z.infer<typeof ImageSchema>
export type SimplifiedArtist = z.infer<typeof SimplifiedArtistSchema>
export type Artist = z.infer<typeof ArtistSchema>
export type Copyright = z.infer<typeof CopyrightSchema>
export type ExternalIds = z.infer<typeof ExternalIdsSchema>
export type Restrictions = z.infer<typeof RestrictionsSchema>
export type LinkedFrom = z.infer<typeof LinkedFromSchema>
export type SimplifiedAlbum = z.infer<typeof SimplifiedAlbumSchema>
export type SimplifiedTrack = z.infer<typeof SimplifiedTrackSchema>
export type Track = z.infer<typeof TrackSchema>
export type AddedBy = z.infer<typeof AddedBySchema>
export type PlaylistedTrack = z.infer<typeof PlaylistedTrackSchema>
export type PlaylistedTrackWithTrack = z.infer<typeof PlaylistedTrackWithTrackSchema>
export type SimplifiedPlaylist = z.infer<typeof SimplifiedPlaylistSchema>
export type Playlist = z.infer<typeof PlaylistSchema>
export type FullSpotifyPlaylist = z.infer<typeof FullSpotifyPlaylistSchema>
export type SimplifiedShow = z.infer<typeof SimplifiedShowSchema>
export type SimplifiedEpisode = z.infer<typeof SimplifiedEpisodeSchema>
export type Episode = z.infer<typeof EpisodeSchema>
export type ResumePoint = z.infer<typeof ResumePointSchema>
export type TrackItem = z.infer<typeof TrackItemSchema>
