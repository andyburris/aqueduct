import { PlaybackState, PlayHistory, Track } from "@spotify/web-api-ts-sdk"

export interface ExportedSpotifyListen {
    ts: string
    username: string
    platform: string
    ms_played: number
    conn_country: string
    ip_addr_decrypted?: string
    user_agent_decrypted?: string
    master_metadata_track_name?: string
    master_metadata_album_artist_name?: string
    master_metadata_album_album_name?: string
    spotify_track_uri?: string
    episode_name?: string
    episode_show_name?: string
    spotify_episode_uri?: string
    reason_start?: string
    reason_end?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    offline_timestamp?: number
    incognito_mode: boolean
}

export interface RawTrack {
    trackName: string,
    artistName: string,
    albumName: string,
    notFoundOnSpotify: boolean,
}
export interface PlayInfo {
    platform?: string,
    millisecondsPlayed: number,
    startReason: StartReason,
    endReason: EndReason,
    shuffle?: boolean,
    skipped?: boolean,
    offline?: boolean,
}
export interface SpotifyListen {
    timestamp: number,
    track: Track | RawTrack,
    playInfo?: PlayInfo,
    uri: string,
}

export function rawToSpotifyListen(raw: ExportedSpotifyListen, track: Track | null | undefined): SpotifyListen | undefined {
    const mustExist = [raw.master_metadata_track_name, raw.master_metadata_album_artist_name, raw.master_metadata_album_album_name, raw.spotify_track_uri]
    if (mustExist.some(s => s == undefined)) return undefined
    return {
        timestamp: new Date(raw.ts).getTime(),
        playInfo: {
            platform: raw.platform,
            millisecondsPlayed: raw.ms_played,
            startReason: parseStartReason(raw.reason_start),
            endReason: parseEndReason(raw.reason_end),
            shuffle: raw.shuffle,
            skipped: raw.skipped,
            offline: raw.offline,
        },
        track: track ?? {
            trackName: raw.master_metadata_track_name!,
            artistName: raw.master_metadata_album_artist_name!,
            albumName: raw.master_metadata_album_album_name!,
            notFoundOnSpotify: track === null,
        },
        uri: raw.spotify_track_uri!,
    }
}

export function playHistoryToSpotifyListen(ph: PlayHistory): SpotifyListen {
    return {
        timestamp: new Date(ph.played_at).getTime(),
        playInfo: undefined,
        track: ph.track,
        uri: ph.track.uri,
    }
}

export function currentlyPlayingToSpotifyListen(current: PlaybackState): SpotifyListen {
    return {
        timestamp: new Date(current.timestamp).getTime(),
        playInfo: undefined, //TODO: add CurrentPlayInfo
        track: current.item as Track,
        uri: current.item.uri,
    }
}

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

function parseStartReason(raw: string | undefined): StartReason {
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

function parseEndReason(raw: string | undefined): EndReason {
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
}