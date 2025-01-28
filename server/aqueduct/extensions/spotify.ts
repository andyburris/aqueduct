import { AccessToken, Page, SimplifiedPlaylist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { Change, diffObject, SyncResult } from "../utils";

export class SpotifyExtension {
    constructor(
        private credentials: { clientID: string },
    ) {}

    public playlists = {
        getAll: (authToken: AccessToken, previous?: SimplifiedPlaylist[]) => {
            const api = SpotifyApi.withAccessToken(this.credentials.clientID, authToken); 
            return getAllPages(api.currentUser.playlists.playlists(), offset => api.currentUser.playlists.playlists(50, offset))
                .then(playlists => {
                    const additions = playlists.filter(newPlaylist => !previous?.find(p => p.id === newPlaylist.id))
                    const updates = playlists.filter(newPlaylist => {
                        const oldPlaylist = previous?.find(p => p.id === newPlaylist.id)
                        return newPlaylist.snapshot_id !== oldPlaylist?.snapshot_id
                    })
                    const deletions = previous?.filter(p => !playlists.find(newPlaylist => newPlaylist.id === p.id)) ?? []
                    const result: SyncResult<SimplifiedPlaylist[]> = {
                        data: playlists,
                        // changes: diffObject(previous, playlists),
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

async function getAllPages<T>(pagePromise: Promise<Page<T>>, getNext: (offset: number) => Promise<Page<T>>): Promise<T[]> {
    const page = await pagePromise
    while(page.next) {
      const nextItems = await getNext(page.items.length)
      page.items.push(...nextItems.items)
      page.next = nextItems.next
    }
    return page.items
  }