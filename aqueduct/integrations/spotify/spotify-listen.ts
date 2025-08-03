import { z } from "zod"
import { ExternalUrlsSchema, TrackItemSchema, TrackSchema } from "./spotify-playlist"

export enum StartReason {
    AppLoad,
    BackButton,
    ClickRow,
    ForwardButton,
    Persisted,
    PlayButton,
    Remote,
    TrackDone,
    TrackError,
    Unknown,
}

export enum EndReason {
    BackButton,
    EndPlay,
    ForwardButton,
    Logout,
    PlayButton,
    Remote,
    TrackDone,
    TrackError,
    UnexpectedExit,
    UnexpectedExitWhilePaused,
    Unknown,
}

const StartReasonTransform = z.string().optional().transform((raw): StartReason => {
    switch(raw?.toLowerCase()) {
        case "appload": return StartReason.AppLoad
        case "backbutton": return StartReason.BackButton
        case "clickrow": return StartReason.ClickRow
        case "forwardbutton": return StartReason.ForwardButton
        case "persisted": return StartReason.Persisted
        case "playbutton": return StartReason.PlayButton
        case "remote": return StartReason.Remote
        case "trackdone": return StartReason.TrackDone
        case "trackerror": return StartReason.TrackError
        case "unknown": return StartReason.Unknown
        default: return StartReason.Unknown
    }
})

const EndReasonTransform = z.string().optional().transform((raw): EndReason => {
    switch(raw?.toLowerCase()) {
        case "backbutton": return EndReason.BackButton
        case "endplay": return EndReason.EndPlay
        case "forwardbutton": return EndReason.ForwardButton
        case "logout": return EndReason.Logout
        case "playbutton": return EndReason.PlayButton
        case "remote": return EndReason.Remote
        case "trackdone": return EndReason.TrackDone
        case "trackerror": return EndReason.TrackError
        case "unexpectedexit": return EndReason.UnexpectedExit
        case "unexpectedexitwhilepaused": return EndReason.UnexpectedExitWhilePaused
        case "unknown": return EndReason.Unknown
        default: return EndReason.Unknown
    }
})

export const ExportedSpotifyListenSchema = z.object({
    ts: z.string(),
    username: z.string(),
    platform: z.string(),
    ms_played: z.number(),
    conn_country: z.string(),
    ip_addr_decrypted: z.string().optional(),
    user_agent_decrypted: z.string().optional(),
    master_metadata_track_name: z.string().optional(),
    master_metadata_album_artist_name: z.string().optional(),
    master_metadata_album_album_name: z.string().optional(),
    spotify_track_uri: z.string().optional(),
    episode_name: z.string().optional(),
    episode_show_name: z.string().optional(),
    spotify_episode_uri: z.string().optional(),
    reason_start: z.string().optional(),
    reason_end: z.string().optional(),
    shuffle: z.boolean().optional(),
    skipped: z.boolean().optional(),
    offline: z.boolean().optional(),
    offline_timestamp: z.number().optional(),
    incognito_mode: z.boolean(),
})

export const RawTrackSchema = z.object({
    trackName: z.string(),
    artistName: z.string(),
    albumName: z.string(),
    notFoundOnSpotify: z.boolean(),
})

export const PlayInfoSchema = z.object({
    platform: z.string().optional(),
    millisecondsPlayed: z.number(),
    startReason: z.enum(StartReason),
    endReason: z.enum(EndReason),
    shuffle: z.boolean().optional(),
    skipped: z.boolean().optional(),
    offline: z.boolean().optional(),
})

export const SpotifyListenSchema = z.object({
    timestamp: z.number(),
    track: z.union([TrackItemSchema, RawTrackSchema]), // Track from API or RawTrack for missing tracks
    playInfo: PlayInfoSchema.optional(),
    uri: z.string(),
})

// Device schema for PlaybackState
export const DeviceSchema = z.object({
    id: z.string().nullable(),
    is_active: z.boolean(),
    is_private_session: z.boolean(),
    is_restricted: z.boolean(),
    name: z.string(),
    type: z.string(),
    volume_percent: z.number().nullable(),
})

// Context schema for PlaybackState and PlayHistory
export const ContextSchema = z.object({
    type: z.string(),
    href: z.string(),
    external_urls: ExternalUrlsSchema,
    uri: z.string(),
})

// Actions schema for PlaybackState
export const ActionsSchema = z.object({
    interrupting_playback: z.boolean().optional(),
    pausing: z.boolean().optional(),
    resuming: z.boolean().optional(),
    seeking: z.boolean().optional(),
    skipping_next: z.boolean().optional(),
    skipping_prev: z.boolean().optional(),
    toggling_repeat_context: z.boolean().optional(),
    toggling_shuffle: z.boolean().optional(),
    toggling_repeat_track: z.boolean().optional(),
    transferring_playback: z.boolean().optional(),
})

// PlaybackState schema
export const PlaybackStateSchema = z.object({
    device: DeviceSchema,
    repeat_state: z.string(),
    shuffle_state: z.boolean(),
    context: ContextSchema.nullable(),
    timestamp: z.number(),
    progress_ms: z.number(),
    is_playing: z.boolean(),
    item: TrackItemSchema, // Track | Episode
    currently_playing_type: z.string(),
    actions: ActionsSchema,
})

// PlayHistory schema
export const PlayHistorySchema = z.object({
    track: TrackSchema,
    played_at: z.string(),
    context: ContextSchema,
})

export type ExportedSpotifyListen = z.infer<typeof ExportedSpotifyListenSchema>
export type RawTrack = z.infer<typeof RawTrackSchema>
export type PlayInfo = z.infer<typeof PlayInfoSchema>
export type SpotifyListen = z.infer<typeof SpotifyListenSchema>
export type Device = z.infer<typeof DeviceSchema>
export type Context = z.infer<typeof ContextSchema>
export type Actions = z.infer<typeof ActionsSchema>
export type PlaybackState = z.infer<typeof PlaybackStateSchema>
export type PlayHistory = z.infer<typeof PlayHistorySchema>

export function rawToSpotifyListen(raw: ExportedSpotifyListen, track: z.infer<typeof TrackSchema> | null | undefined): SpotifyListen | undefined {
    const mustExist = [raw.master_metadata_track_name, raw.master_metadata_album_artist_name, raw.master_metadata_album_album_name, raw.spotify_track_uri]
    if (mustExist.some(s => s == undefined)) return undefined
    
    const playInfo: PlayInfo = {
        platform: raw.platform,
        millisecondsPlayed: raw.ms_played,
        startReason: StartReasonTransform.parse(raw.reason_start),
        endReason: EndReasonTransform.parse(raw.reason_end),
        shuffle: raw.shuffle,
        skipped: raw.skipped,
        offline: raw.offline,
    }
    
    const rawTrack: RawTrack = {
        trackName: raw.master_metadata_track_name!,
        artistName: raw.master_metadata_album_artist_name!,
        albumName: raw.master_metadata_album_album_name!,
        notFoundOnSpotify: track === null,
    }
    
    return {
        timestamp: new Date(raw.ts).getTime(),
        playInfo,
        track: track ?? rawTrack,
        uri: raw.spotify_track_uri!,
    }
}

export function playHistoryToSpotifyListen(ph: PlayHistory, timestamp: string = ph.played_at): SpotifyListen {
    return {
        timestamp: new Date(timestamp).getTime(),
        playInfo: undefined,
        track: ph.track,
        uri: ph.track.uri,
    }
}

export function currentlyPlayingToSpotifyListen(current: PlaybackState): SpotifyListen {
    return {
        timestamp: new Date(current.timestamp).getTime(),
        playInfo: undefined, //TODO: add CurrentPlayInfo
        track: current.item,
        uri: current.item.uri,
    }
}