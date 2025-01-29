"use client"

import { PageProvider } from "@/app/page";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { useEffect } from "react";
import { Inspector } from "tinybase/ui-react-inspector";
import { useOnLoadStoresEffect } from "../useOnLoadStoresEffect";

export default function Page() {
    return (
        <PageProvider>
            <SpotifyCallbackPage/>
        </PageProvider>
    )
}

function SpotifyCallbackPage() {
    useOnLoadStoresEffect((secureStore, sharedStore) => {
        SpotifyApi.performUserAuthorization(
            "b10a0181d9ac49b28846cbd7413193e1", 
            "https://localhost:3000/auth/spotify",
            ["playlist-read-private"],
            async (token) => {
                console.log("Got Spotify token: ", token)
                secureStore.setRow("auth", "spotify", token as any);
                sharedStore.setCell("extensions", "spotify", "authStatus", "authenticating");  
                localStorage.removeItem("spotify-sdk:AuthorizationCodeWithPKCEStrategy:token")        
            }
        )
    })

    return (
        <div className="flex justify-center items-center h-screen">
            <p>Processing Spotify authentication...</p>
            <Inspector/>
        </div>
    )
}