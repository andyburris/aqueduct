import { AccessToken } from '@spotify/web-api-ts-sdk';
import { FullSpotifyPlaylist, SpotifyExtension, Stream, seconds } from 'aqueduct';
import { SpotifyIntegration } from '../../jazz';
import { MOCK_PLAYLISTS } from "../../src/home/mocks"

export function syncSpotify(data: SpotifyIntegration) {
    const spotifyCache = {
      lastSyncedAt: 0,
      playlists: [] as FullSpotifyPlaylist[],
    }

    const spotify = new SpotifyExtension({ 
      clientID: process.env.SPOTIFY_CLIENT_ID ?? "",
    });

    // const [unsavedToken, tokenHandle] = Stream.fromHandle<AccessToken>()
    // const unsavedToken = Stream.of(token)

    // const saveUnsavedToken = unsavedToken.listen(token => spotifyData.authentication = token)

    const test = Stream.periodic(seconds(15))
      .listen(async () => {
        console.log("deep loading spotify playlists")
        const loaded = await data.ensureLoaded({ resolve: { playlists: true }})
        console.log("applying mocks")
        loaded.playlists.applyDiff(MOCK_PLAYLISTS)
        console.log("applied diffs")
      })

    const token = Stream
      .fromListener<AccessToken>(emit => data.subscribe({ resolve: { } }, (i) => { if(i.authentication) emit(i.authentication) }))
      .onEach(token => console.log("Got token: ", token))
      .filter(c => isAccessToken(c))

    token
    .every(
        seconds(30),
        data.lastTriedSyncedAt?.getTime(),
        syncedAt => data.lastTriedSyncedAt = new Date(syncedAt)
    )
    .map(token => {
      const previousPlaylists = data.playlists
      return spotify.playlists.getAll(token, previousPlaylists?.map(p => p))
    }, 1)
    .listen(playlists => {
      // save to database
      playlists.changes.additions.forEach(a => data.playlists?.push(a.value))
      playlists.changes.updates.forEach(u => {
        const index = data.playlists?.findIndex(p => p!.id === u.value.id)!
        data.playlists![index] = u.value
      })
      playlists.changes.deletions.forEach(d => {
        const index = data.playlists?.findIndex(p => p!.id === d.value.id)
        if (data.playlists && index) data.playlists.splice(index, 1)
      })

      // for now, just applyDiff the entire playlists
      // later when timeline items are saved in the storage instead of being calculated on-the-fly, do the calculation here
    });
}

function isAccessToken(token: any): token is AccessToken {
    return "access_token" in token && "token_type" in token && "expires_in" in token && "refresh_token" in token && "expires" in token;
}