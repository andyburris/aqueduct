type SpotifyAuth = string
type SpotifyPlaylist = {
    id: string
    name: string
    tracks: SpotifyTrack[]
}
type SpotifyTrack = {
    id: string
    name: string
    artists: string[]
}
class SpotifyExtension {
    public pipelines = {
        auth: {
            exchangeCodeForToken: (code: string) => { return "" },
        },
        playlists: {
            getAll: (authToken: SpotifyAuth, options: { userOnly: boolean }, previous: SpotifyPlaylist[]) => {},
        },
    }
    public flows = {

    }
}