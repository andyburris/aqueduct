import { AccessToken } from '@spotify/web-api-ts-sdk';
import { flatten, unflatten } from 'flat';
import { Row, Store, Table } from 'tinybase';
import { loadRowAndListen } from './demo-utils';
import { FullSpotifyPlaylist, SpotifyExtension } from './extensions/spotify';
import { Stream, seconds } from './stream';


export function syncSpotify(secureStore: Store, sharedStore: Store, serverStore: Store) {
    // Initialize
    const spotify = new SpotifyExtension({ 
      clientID: process.env.SPOTIFY_CLIENT_ID ?? "",
    });

    const spotifyToken = Stream
        .listener<Row | null | undefined>(emit => loadRowAndListen(secureStore, "auth", "spotify", emit))
        .filterType(c => isAccessToken(c))
        .onEach(token => sharedStore.setCell("extensions", "spotify", "authStatus", "authenticated"));


    // Playlist sync
    const playlists = spotifyToken
    .every(
        seconds(30),
        sharedStore.getCell("extensions", "spotify", "lastTriedSyncedAt") as number | undefined,
        syncedAt => sharedStore.setCell("extensions", "spotify", "lastTriedSyncedAt", syncedAt)
    )
    .mapConcurrent(token => {
      const previousPlaylistsTable = serverStore.getTable("spotify")
      console.log(`Syncing playlists with ${Object.values(previousPlaylistsTable).length} previous playlists...`)
      const previousPlaylists = Object.values(previousPlaylistsTable).map(p => unflatten(p) as FullSpotifyPlaylist)
      return spotify.playlists.getAll(token, previousPlaylists)
    }, 1)
    .onEach(playlists => console.log(`Finished syncing ${playlists.data.length} playlists`))
    .onEach(playlists => {
      const flattened = Object.fromEntries(playlists.data.map(p => [p.id, flatten(p)])) as Table
      serverStore.setTable("spotify", flattened)


      const [additions, updates, deletions] = playlists.changes.reduce(([a, u, d], c) => {
        if(c.operation === "add") return [[...a, c.value], u, d]
        if(c.operation === "update") return [a, [...u, c.value], d]
        if(c.operation === "delete") return [a, u, [...d, c.value]]
        return [a, u, d]
      }, [[], [], []] as [FullSpotifyPlaylist[], FullSpotifyPlaylist[], FullSpotifyPlaylist[]])
      console.log(`Got ${additions.length} additions, ${updates.length} updates, and ${deletions.length} deletions`)

      const additionsAsNotes: [string, any][] = additions.map(p => asNote(p))
      const updatesAsNotes: [string, any][] = updates.map(p => asNote(p, true))
      sharedStore.transaction(() => {
        additionsAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
        updatesAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
        deletions.forEach(p => sharedStore.delRow("notes", p.id))
      })
      sharedStore.setCell("extensions", "spotify", "lastSyncedAt", Date.now())
      // console.log('Got playlists:', playlists.data)
    });
}

function asNote(playlist: FullSpotifyPlaylist, isUpdated?: boolean): [string, any] {
  const addedDates = playlist.fullTracks.map(t => Date.parse(t.added_at))
  const earliestTrackAdded = Math.min(...addedDates)
  const latestTrackAdded = Math.max(...addedDates)
  const note = {
      id: playlist.id,
      title: playlist.name,
      content: `${playlist.tracks?.total} tracks`,
      source: "spotify",
      timestamp: latestTrackAdded,
      editedTimestamp: isUpdated ? Date.now() : latestTrackAdded,
      createdTimestamp: earliestTrackAdded,
      syncedTimestamp: Date.now(),
  }
  return [playlist.id, { ...note }]
}

function isAccessToken(token: any): token is AccessToken {
    return "access_token" in token && "token_type" in token && "expires_in" in token && "refresh_token" in token && "expires" in token;
}