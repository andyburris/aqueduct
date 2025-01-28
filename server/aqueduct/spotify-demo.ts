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
        .onEach(token => {
          console.log('Got stored token:', token)
          sharedStore.setCell("extensions", "spotify", "authStatus", "authenticated")
        });


    // Playlist sync
    const playlists = spotifyToken
    .every(
        seconds(30),
        sharedStore.getCell("extensions", "spotify", "lastSyncedAt") as number | undefined,
        syncedAt => sharedStore.setCell("extensions", "spotify", "lastSyncedAt", syncedAt)
    )
    .onEach(() => console.log('Syncing playlists...'))
    .mapConcurrent(token => {
      const previousPlaylistsTable = serverStore.getTable("spotify")
      const previousPlaylists = Object.values(previousPlaylistsTable).map(p => unflatten(p) as FullSpotifyPlaylist)
      return spotify.playlists.getAll(token, previousPlaylists)
    }, 1)
    .onEach(playlists => console.log(`Finished syncing ${playlists.data.length} playlists...`))
    .onEach(playlists => {
      const flattened = Object.fromEntries(playlists.data.map(p => [p.id, flatten(p)])) as Table
      serverStore.setTable("spotify", flattened)


      const [additions, updates, deletions] = playlists.changes.reduce(([a, u, d], c) => {
        if(c.operation === "add") return [[...a, c.value], u, d]
        if(c.operation === "update") return [a, [...u, c.value], d]
        if(c.operation === "delete") return [a, u, [...d, c.value]]
        return [a, u, d]
      }, [[], [], []] as [FullSpotifyPlaylist[], FullSpotifyPlaylist[], FullSpotifyPlaylist[]])

      const additionsAsNotes: [string, any][] = additions.map(asNote)
      const updatesAsNotes: [string, any][] = updates.map(asNote)
      sharedStore.transaction(() => {
        additionsAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
        updatesAsNotes.forEach(([k, v]) => sharedStore.setRow("notes", k, v))
        deletions.forEach(p => sharedStore.delRow("notes", p.id))
      })
      sharedStore.setCell("extensions", "spotify", "lastSynced", Date.now())
      // console.log('Got playlists:', playlists.data)
    });
}

function asNote(playlist: FullSpotifyPlaylist): [string, any] {
  const addedDates = playlist.fullTracks.map(t => Date.parse(t.added_at))
  const earliestTrackAdded = Math.min(...addedDates)
  const latestTrackAdded = Math.max(...addedDates)
  const note = {
      id: playlist.id,
      title: playlist.name,
      content: `${playlist.tracks?.total} tracks`,
      source: "spotify",
      timestamp: latestTrackAdded,
      editedTimestamp: latestTrackAdded,
      createdTimestamp: earliestTrackAdded,
      syncedTimestamp: Date.now(),
  }
  return [playlist.id, { ...note }]
}

function isAccessToken(token: any): token is AccessToken {
    return "access_token" in token && "token_type" in token && "expires_in" in token && "scope" in token && "expires" in token;
}