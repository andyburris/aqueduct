"use client"

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { useAccount } from "jazz-react";
import { useEffect } from "react";
import { localAddress } from "../localaddress";
import { useNavigate } from "react-router";


export function SpotifyCallbackPage() {
    const navigate = useNavigate()
    const { me } = useAccount({ resolve: { root: { integrations: { spotifyIntegration: {} }}}})
    useEffect(() => {
        console.log("Spotify callback effect, account = ", me)
        if(!me) return
        SpotifyApi.performUserAuthorization(
            "b10a0181d9ac49b28846cbd7413193e1", 
            `${localAddress}/auth/spotify`,
            ["playlist-read-private", "user-read-recently-played", "user-read-currently-playing"],
            async (token) => {
                console.log("Got Spotify token: ", token)
                me.root.integrations.spotifyIntegration.applyDiff({ authentication: token })
                localStorage.removeItem("spotify-sdk:AuthorizationCodeWithPKCEStrategy:token")   
                navigate("/integrations")
            }
        )
    }, [me])


    return (
        <div className="flex justify-center items-center h-screen">
            <p>Processing Spotify authentication...</p>
        </div>
    )
}