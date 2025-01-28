import { AccessToken, Page, PlaylistedTrack, SimplifiedPlaylist, SimplifiedTrack, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { Change, diffObject, SyncResult } from "../utils";

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
                .then(async playlists => {
                    // return Promise.all(playlists.map(async p => {
                    //     const unchangedOriginal = previous?.find(pp => pp.id === p.id && pp.snapshot_id === p.snapshot_id)
                    //     if (unchangedOriginal) return unchangedOriginal
                    //     const tracks = await getAllPages(api.playlists.getPlaylistItems(p.id), offset => api.playlists.getPlaylistItems(p.id, undefined, undefined, 50, offset))
                    //     return { ...p, fullTracks: tracks } as FullSpotifyPlaylist
                    // }))
                    const fullPlaylists = []
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
                            fullPlaylists.push({ ...p, fullTracks: tracks } as FullSpotifyPlaylist)
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
                        return newPlaylist.snapshot_id !== oldPlaylist?.snapshot_id
                    })
                    const deletions = previous?.filter(p => !playlists.find(newPlaylist => newPlaylist.id === p.id)) ?? []
                    const result: SyncResult<FullSpotifyPlaylist[]> = {
                        data: playlists,
                        changes: [
                            ...additions.map(p => ({ operation: "add", value: p } as Change)),
                            ...updates.map(p => ({ operation: "update", value: p } as Change)),
                            ...deletions.map(p => ({ operation: "delete", value: p } as Change)),
                        ]
                    }
                    return result
                })
        },
    }
    public listens = {

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