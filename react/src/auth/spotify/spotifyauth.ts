import { SpotifyApi } from "@spotify/web-api-ts-sdk"
import { localAddress } from "../localaddress"

export function redirectSpotifyAuth() {
    SpotifyApi.performUserAuthorization(
        "b10a0181d9ac49b28846cbd7413193e1", 
        `${localAddress}/auth/spotify`,
        ["playlist-read-private"],
        async (token) => { throw new Error("Should never be called--did you clear the previous token correctly?") }
    )
}