import { Stream, seconds } from './hotstream';

// Mock Spotify extension
class SpotifyExtension {
  auth = {
    exchangeCodeForToken: (code: string) => `token-${code}`
  };
  playlists = {
    getAll: async (token: string, options: { userOnly: boolean }) => ({
      data: [`playlist-${token}-1`, `playlist-${token}-2`],
      changes: [
        { type: 'add', path: 'data.playlists.0', data: { id: 1, name: 'New Playlist' } },
        { type: 'update', path: 'data.playlists.1', data: { id: 2, name: 'Updated Playlist' } }
      ]
    })
  };
}

function spotifyDemo() {
    // Mock storage for demo purposes
    const storage: Record<string, any> = {};

    // Initialize
    const spotify = new SpotifyExtension();

    // Create handle for authentication code
    const [spotifyCodeHandle, spotifyCode] = Stream.handle<string>();

    // Authentication flow
    const spotifyCodeExchange = spotifyCode
    .map(code => spotify.auth.exchangeCodeForToken(code))
    .onEach(token => console.log('Got token:', token))
    .onEach(token => storage["spotifyToken"] = token);

    const storedToken = Stream
        .single(storage["spotifyToken"])
        .onEach(token => console.log('Got stored token:', token));

    const spotifyAuthToken = Stream
    .or(spotifyCodeExchange, storedToken)
    .onEach(token => storage["spotifyLoggedIn"] = token !== undefined);

    // Playlist sync
    const playlists = spotifyAuthToken
    .onEach(token => console.log('Before every, currentSynced at:', storage["spotifySyncedAt"], "token:", token))
    .every(
        seconds(30),
        storage["spotifySyncedAt"],
        syncedAt => { 
            console.log("Saving synced at:", syncedAt);
            storage["spotifySyncedAt"] = syncedAt
        }
    )
    .onEach(() => console.log('Syncing playlists...'))
    .map(token => spotify.playlists.getAll(token, { userOnly: true }));

    // Basic storage example
    playlists
        .onEach(response => storage["spotifyPlaylists"] = response.data)
        .onEach(response => console.log('Got full playlists:', response.data));

    // Incremental storage example
    playlists.onEach(response => 
        response.changes
            .filter(change => change.path.match("data.playlists.*"))
            .forEach(change => {
              if (change.type === "add") console.log('Would insert:', change.data);
              if (change.type === "delete") console.log('Would remove:', change.data.id);
              if (change.type === "update") console.log('Would update:', change.data);
            })
    )

    // const undf = Stream.single(undefined);
    // const [neverCalledHandle, neverCalled] = Stream.handle<string>();

    // Stream
    //     .combine([undf, neverCalled])
    //     .every(seconds(1), undefined, () => console.log('Should never save'))
    //     .onEach(() => console.log('Should not be called'));

    // Test it out
    return spotifyCodeHandle;
}