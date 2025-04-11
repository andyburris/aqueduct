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
    .map(token => {
      const previousPlaylists = loadedData.playlists
      console.log(`getting playlists with ${previousPlaylists.length} previous playlists`)
      return spotify.playlists.getAll(token, previousPlaylists.map(p => p))
    }, 1)
    .listen(playlists => loadedData.playlists.applyDiff(playlists.data));
}

function isAccessToken(token: any): token is AccessToken {
    return "access_token" in token && "token_type" in token && "expires_in" in token && "refresh_token" in token && "expires" in token;
}