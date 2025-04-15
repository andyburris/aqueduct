import { AccessToken, Page, PlaylistedTrack, SimplifiedPlaylist, SimplifiedTrack, SpotifyApi, Track, MaxInt } from "@spotify/web-api-ts-sdk";
import { Change, diffObject, fetchWindowed, generateUUID, fetchDiff, SyncResult, SyncResultChanges } from "../../utils";
import { currentlyPlayingToSpotifyListen, ExportedSpotifyListen, playHistoryToSpotifyListen, rawToSpotifyListen, SpotifyListen } from "./spotify-listen";
import { unzip } from "unzipit";

export interface FullSpotifyPlaylist extends SimplifiedPlaylist {
    fullTracks: PlaylistedTrack<Track>[]
}

export class SpotifyExtension {
    constructor(
        private credentials: { clientID: string },
    ) {}

    public playlists = {
        getAll: (authToken: AccessToken, previous?: FullSpotifyPlaylist[]) => {
            const api = SpotifyApi.withAccessToken(this.credentials.clientID, authToken); 
            return getAllPages(api.currentUser.playlists.playlists(), offset => api.currentUser.playlists.playlists(50, offset))
                .then(playlists => playlists.slice(0, 5))
                .then(async playlists => {
                    const fullPlaylists: FullSpotifyPlaylist[] = []
                    for (const p of playlists) {
                        const unchangedOriginal = previous?.find(pp => pp.id === p.id && pp.snapshot_id === p.snapshot_id)
                        if (unchangedOriginal) {
                            fullPlaylists.push(unchangedOriginal)
                        } else {
                            const tracks = await getAllPages(
                                api.playlists.getPlaylistItems(p.id), 
                                offset => api.playlists.getPlaylistItems(p.id, undefined, undefined, 50, offset),
                                1000
                            )
                            fullPlaylists.push({ ...p, fullTracks: tracks })
                            console.log(`Finished syncing tracks for playlist ${playlists.indexOf(p) + 1}/${playlists.length}`)
                            await new Promise(r => setTimeout(r, 200)) //delay to prevent rate limits
                        }
                    }
                    return fullPlaylists
                })
                .then(playlists => {
                    const additions = playlists.filter(newPlaylist => !previous?.find(p => p.id === newPlaylist.id))
                    const updates = playlists.filter(newPlaylist => {
                        const oldPlaylist = previous?.find(p => p.id === newPlaylist.id)
                        return oldPlaylist && newPlaylist.snapshot_id !== oldPlaylist?.snapshot_id
                    })
                    const deletions = previous?.filter(p => !playlists.find(newPlaylist => newPlaylist.id === p.id)) ?? []
                    const result: SyncResult<FullSpotifyPlaylist[]> = {
                        data: playlists,
                        changes: new SyncResultChanges(
                            additions.map(p => ({ operation: "add", value: p } as Change)),
                            updates.map(p => ({ operation: "update", value: p } as Change)),
                            deletions.map(p => ({ operation: "delete", value: p } as Change)),
                        )
                    }
                    return result
                })
        },
    }
    public listens = {
        getCurrent: async (authToken: AccessToken, previous?: SpotifyListen[]) => {
            const api = SpotifyApi.withAccessToken(this.credentials.clientID, authToken); 
            const current = await api.player.getCurrentlyPlayingTrack()
            console.log(`got current`)
            return await fetchDiff({
                currentItems: [current].filter(current => "album" in current.item), //TODO: add podcast support
                savedItems: previous ?? [],
                currentSignature: current => new Date(current.timestamp).toISOString() + "|" + current.item.uri,
                savedSignature: l => new Date(l.timestamp).toISOString() + "|" + l.uri,
                convert: { each: current => currentlyPlayingToSpotifyListen(current) }
            })
        },
        getRecents: async (authToken: AccessToken, previous?: SpotifyListen[], limit: MaxInt<50> = 50) => {
            const api = SpotifyApi.withAccessToken(this.credentials.clientID, authToken); 
            const items = (await api.player.getRecentlyPlayedTracks(limit).catch(err => console.error("error getting recents", err)))?.items ?? []
            items.sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
            // console.log(`got ${items.length} recents, most recently played at ${new Date(items[items.length - 1]?.played_at).toLocaleTimeString()}`)
            // for some reason, each item gets the next one's played out time
            // so, we drop the first item, and get the last played time from the last item
            return await fetchDiff({
                currentItems: items.slice(1),
                savedItems: previous ?? [],
                currentSignature: ph => new Date(items[items.indexOf(ph) - 1].played_at).toISOString() + "|" + ph.track.uri,
                savedSignature: l => new Date(l.timestamp).toISOString() + "|" + l.uri,
                convert: { all: (currents, _, signatures) => {
                    // console.log(`converting ${currents.length} recents: \n`, currents.map((c, i) => `${c.track.name} | ${new Date(signatures[i].split("|")[0]).toTimeString()} | ${new Date(items[i].played_at).toTimeString()}`).join(",\n"))
                    return currents
                        .map((current, index) => playHistoryToSpotifyListen(current, items[items.indexOf(current) - 1].played_at))
                } },
            })
        },
        unzipExportFile: async (file: File) => {
            const {entries} = await unzip(file);
            const relevantFiles = Object.entries(entries).filter(([filename, entry]) => filename.endsWith(".json") && filename.includes("Audio")) 
        
            const textDecoder = new TextDecoder()
            const filePromises: Array<Promise<Array<ExportedSpotifyListen>>> = relevantFiles.map(([filename, entry]) => {
                return entry
                    .arrayBuffer()
                    .then(buffer => new Uint8Array(buffer))
                    .then(array => textDecoder.decode(array))
                    .then(s => JSON.parse(s) as Array<ExportedSpotifyListen>)
            })
            const allEntries: Array<ExportedSpotifyListen> = (await Promise.all(filePromises)).flat()
            return allEntries        
        },
        parseExportData: async (authToken: AccessToken | null, exported: ExportedSpotifyListen[], previous?: SpotifyListen[]) => {
            const api = authToken ? SpotifyApi.withAccessToken(this.credentials.clientID, authToken) : null
            console.log(`parsing export data with ${previous?.length} previous listens, api: ${!!api}`)

            return fetchDiff({
                currentItems: exported,
                savedItems: previous ?? [],
                currentSignature: (raw) => new Date(raw.ts).toISOString() + "|" + raw.spotify_track_uri,
                savedSignature: l => new Date(l.timestamp).toISOString() + "|" + l.uri,
                createCache: (savedItems) => new Map(savedItems.filter(l => "album" in l.track).map(l => [l.uri, l.track as Track])),
                convert: {
                    all: async (raws, cache) => {
                        console.log("running convert")
                        const rawSongs = raws.filter(raw => !!raw.spotify_track_uri)
                        const uncachedIDs = new Set(rawSongs.filter(raw => !cache.has(raw.spotify_track_uri!)).map(raw => raw.spotify_track_uri!.replace("spotify:track:", "")))
                        console.log(`Getting ${uncachedIDs.size} tracks for ${rawSongs.length} new listens`)
                        const uncachedTracks = api
                            ? await 
                                fetchWindowed({
                                    items: Array.from(uncachedIDs),
                                    windowSize: 50,
                                    fetch: (ids) => api.tracks.get(ids),
                                    parallel: false,
                                    onProgress: (progress => {
                                        console.log(`Fetched ${progress * 50} of ${uncachedIDs.size} tracks`)
                                    })
                                }) 
                                .then(tracks => { console.log(`got ${tracks.length} tracks`); return tracks })
                                .catch(err => console.error(`error getting ${uncachedIDs.size} tracks from spotify: `, err))
                            : []
                        uncachedTracks?.forEach(t => cache.set(t.uri, t))
                        return rawSongs.map(raw => rawToSpotifyListen(raw, cache.get(raw.spotify_track_uri!))).filter(l => !!l) as SpotifyListen[]
                    }
                }
            })
        },
        parseExportFile: async (authToken: AccessToken | null, file: File, previous?: SpotifyListen[]) => {
            this.listens.parseExportData(authToken, await this.listens.unzipExportFile(file), previous)
        },
    }
    public flows = {

    }
}

async function getAllPages<T>(
    pagePromise: Promise<Page<T>>, 
    getNext: (offset: number) => Promise<Page<T>>,
    maxItems?: number
): Promise<T[]> {
    const page = await pagePromise
    while(page.next) {
      if(maxItems && page.items.length >= maxItems) break
      const nextItems = await getNext(page.items.length)
      page.items.push(...nextItems.items)
      page.next = nextItems.next
    }
    return page.items
  }