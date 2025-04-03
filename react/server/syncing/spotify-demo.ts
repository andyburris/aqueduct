import { AccessToken } from '@spotify/web-api-ts-sdk';
import { SpotifyExtension, Stream, seconds } from 'aqueduct';
import { SpotifyIntegration } from '../../jazz';

export async function syncSpotify(data: SpotifyIntegration) {
    const spotify = new SpotifyExtension({ 
      clientID: process.env.SPOTIFY_CLIENT_ID ?? "",
    });

    const loadedData = await data.ensureLoaded({ resolve: { playlists: true }})

    const token = Stream
      .fromListener<AccessToken>(emit => loadedData.subscribe({ resolve: { } }, (i) => { if(i.authentication) emit(i.authentication) }))
      .dropRepeats()
      .onEach(token => console.log("Got token: ", token))
      .filter(c => isAccessToken(c))

    token
    .every(
        seconds(30),
        data.lastTriedSyncedAt?.getTime(),
        syncedAt => data.lastTriedSyncedAt = new Date(syncedAt)
    )
    .map(async token => {
      const previousPlaylists = loadedData.playlists
      console.log(`getting playlists with ${previousPlaylists.length} previous playlists`)
      return spotify.playlists.getAll(token, previousPlaylists.map(p => p))
    }, 1)
    .listen(async playlists => {
      // console.log("Got playlists: ", JSON.stringify(playlists, null, 2))
      // console.log("Got playlist ids: ", playlists.data.map(p => p.id))
      const loaded = await data.ensureLoaded({ resolve: { playlists: true }})
      loaded.playlists.applyDiff(playlists.data)
      // save to database
      // playlists.changes.additions.forEach(a => data.playlists?.push(a.value))
      // playlists.changes.updates.forEach(u => {
      //   const index = data.playlists?.findIndex(p => p!.id === u.value.id)!
      //   data.playlists![index] = u.value
      // })
      // playlists.changes.deletions.forEach(d => {
      //   const index = data.playlists?.findIndex(p => p!.id === d.value.id)
      //   if (data.playlists && index) data.playlists.splice(index, 1)
      // })

      // for now, just applyDiff the entire playlists
      // later when timeline items are saved in the storage instead of being calculated on-the-fly, do the calculation here
    });
}

function isAccessToken(token: any): token is AccessToken {
    return "access_token" in token && "token_type" in token && "expires_in" in token && "refresh_token" in token && "expires" in token;
}