"use client"

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { useEffect } from "react";
import { useOnLoadStoresEffect } from "../useOnLoadStoresEffect";
import { JazzAndAuth } from "@/app/common/JazzAndAuth";
import { useAccount } from "jazz-react";

export default function Page() {
    return (
        <JazzAndAuth>
            <SpotifyCallbackPage/>
        </JazzAndAuth>
    )
}

function SpotifyCallbackPage() {
    const { me } = useAccount({ root: {} })
    useEffect(() => {
        console.log("Spotify callback effect, account = ", me)
        if(!me) return
        me.ensureLoaded({})
            .then(() => {
                console.log("Ensured loaded")
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
        
            })
    }, [me])


    return (
        <div className="flex justify-center items-center h-screen">
            <p>Processing Spotify authentication...</p>
        </div>
    )
}