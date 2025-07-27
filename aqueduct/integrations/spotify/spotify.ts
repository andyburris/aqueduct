import { AccessToken, MaxInt, Page, PlaylistedTrack, SimplifiedPlaylist, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { unzip } from "unzipit";
import { fetchDiff, fetchWindowed } from "../../core/fetch";
import { currentlyPlayingToSpotifyListen, ExportedSpotifyListen, playHistoryToSpotifyListen, rawToSpotifyListen, SpotifyListen } from "./spotify-listen";

export interface FullSpotifyPlaylist extends SimplifiedPlaylist {
    fullTracks: PlaylistedTrack<Track>[]
}

export class SpotifyExtension {
    constructor(
        private credentials: { clientID: string },
    ) {}

    public playlists = {
        getAll: async (authToken: AccessToken, previous?: FullSpotifyPlaylist[]) => {
            const api = SpotifyApi.withAccessToken(this.credentials.clientID, authToken); 
            const playlists = await getAllPages(api.currentUser.playlists.playlists(), offset => api.currentUser.playlists.playlists(50, offset))
                .then(playlists => playlists.slice(0, 5))

            return await fetchDiff({
                currentItems: playlists,
                storedItems: previous ?? [],
                currentIdentifier: p => p.id,
                storedIdentifier: p => p.id,
                currentSignature: p => p.id + "|" + p.snapshot_id,
                storedSignature: p => p.id + "|" + p.snapshot_id,
                keepStaleItems: false,
                convert: {
                    all: async (changed) => {
                        const fullPlaylists: FullSpotifyPlaylist[] = []
                        for (const p of changed) {
                            const tracks = await getAllPages(
                                api.playlists.getPlaylistItems(p.id), 
                                offset => api.playlists.getPlaylistItems(p.id, undefined, undefined, 50, offset),
                                1000
                            )
                            fullPlaylists.push({ ...p, fullTracks: tracks })
                            console.log(`Finished syncing tracks for playlist ${playlists.indexOf(p) + 1}/${playlists.length}`)
                            await new Promise(r => setTimeout(r, 200)) //delay to prevent rate limits
                        }
                        return fullPlaylists
                    },
                }
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
                storedItems: previous ?? [],
                currentIdentifier: current => new Date(current.timestamp).toISOString() + "|" + current.item.uri,
                storedIdentifier: l => new Date(l.timestamp).toISOString() + "|" + l.uri,
                keepStaleItems: true,
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
                storedItems: previous ?? [],
                currentIdentifier: ph => new Date(items[items.indexOf(ph) - 1].played_at).toISOString() + "|" + ph.track.uri,
                storedIdentifier: l => new Date(l.timestamp).toISOString() + "|" + l.uri,
                keepStaleItems: true,
                convert: { all: (currents) => {
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
                storedItems: previous ?? [],
                currentIdentifier: (raw) => new Date(raw.ts).toISOString() + "|" + raw.spotify_track_uri,
                storedIdentifier: l => new Date(l.timestamp).toISOString() + "|" + l.uri,
                keepStaleItems: (staleItems, nonStaleItems) => {
                    const latestNonStaleTimestamp = Math.max(...nonStaleItems.map(l => new Date(l.timestamp).getTime()))
                    return staleItems.filter(l => new Date(l.timestamp).getTime() > latestNonStaleTimestamp)
                },
                createCache: (storedItems) => new Map(storedItems.filter(l => "album" in l.track).map(l => [l.uri, l.track as Track])),
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