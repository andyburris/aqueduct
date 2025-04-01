"use client"

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { useAccount } from "jazz-react";
import { useEffect } from "react";
import { JazzAndAuth } from "../../common/JazzAndAuth";

export function SpotifyCallbackPage() {
    return (
        <JazzAndAuth>
            <InnerPage/>
        </JazzAndAuth>
    )
}

function InnerPage() {
    const { me } = useAccount({ resolve: { root: {} }})
    useEffect(() => {
        console.log("Spotify callback effect, account = ", me)
        if(!me) return
        SpotifyApi.performUserAuthorization(
            "b10a0181d9ac49b28846cbd7413193e1", 
            "https://localhost:3000/auth/spotify",
            ["playlist-read-private"],
            async (token) => {
                console.log("Got Spotify token: ", token)
                // me.root.spotifyIntegration?.applyDiff({ authentication: token })
                localStorage.removeItem("spotify-sdk:AuthorizationCodeWithPKCEStrategy:token")        
            }
        )
    }, [me])


    return (
        <div className="flex justify-center items-center h-screen">
            <p>Processing Spotify authentication...</p>
        </div>
    )
}