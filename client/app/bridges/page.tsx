"use client"

import { Bridge, CaretRight, CodeSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileTrigger, Input, Label, TextField } from "react-aria-components";
import { useCell, useDelRowCallback, useSetCellCallback, useStore, useTable } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { generateGoogleAuthURL } from "../auth/google/googleauth";
import { redirectSpotifyAuth } from "../auth/spotify/spotifyauth";
import { Button, Link } from "../common/Components";
import { Container } from "../common/Container";
import { PageProvider } from "../page";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { GoogleDriveLogo, LogoForSource, SpotifyLogo } from "../common/Logos";

export default function Page() {
    return (
        <PageProvider>
            <BridgesPage/>
        </PageProvider>
    )
}

function BridgesPage() {
    const router = useRouter()
    const extensionSettings = useTable("extensions")

    const sharedStore = useStore()
    const secureStore = useStore("secure")

    const supernotesAPIKey = useCell("auth", "supernotes", "apiKey", "secure")
    const updateSupernotesAPIKey = useSetCellCallback("auth", "supernotes", "apiKey", (v: string) => v,  [], "secure")

    const notionUserID = useCell("auth", "notion", "activeUserID", "secure")
    const updateNotionUserID = useSetCellCallback("auth", "notion", "activeUserID", (v: string) => v,  [], "secure")

    const notionAPIKey = useCell("auth", "notion", "apiKey", "secure")
    const updateNotionAPIKey = useSetCellCallback("auth", "notion", "apiKey", (v: string) => v,  [], "secure")

    const removeGoogleAuth = useDelRowCallback("auth", "google-drive", "secure")
    const updateGoogleAuthStatus = useSetCellCallback("extensions", "google-drive", "authStatus", (v: string) => v, [])

    const removeSpotifyAuth = useDelRowCallback("auth", "spotify", "secure")
    const updateSpotifyAuthStatus = useSetCellCallback("extensions", "spotify", "authStatus", (v: string) => v, [])


    return (
        <Container>
            <Header/>
            <div className="flex flex-col">
                <BridgeItem
                    id="supernotes"
                    name="Supernotes"
                    authStatus={(useCell("extensions", "supernotes", "authStatus") as string | undefined) === "authenticated" ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSynced={useCell("extensions", "supernotes", "lastSyncedAt") as number | undefined}
                    unauthenticatedChildren={
                        <div className="flex flex-col gap-4">
                            <p>1. Get your Supernotes API Key at <a href="https://my.supernotes.app" target="_blank" rel="noreferrer">my.supernotes.app</a> → Settings → API & Integrations → Manage API Keys</p>
                            <p>2. Add the API key you generated to Skybridge</p>
                            <TextField 
                                className={"w-full bg-white shadow-outset rounded-xl flex items-center"}
                                value={(supernotesAPIKey as string | undefined) ?? ""}
                                onChange={v => updateSupernotesAPIKey(v)}
                                >
                                <Label className="sr-only">Supernotes API Key</Label>
                                <CodeSimple className="text-stone-400 text-xl m-3"/>
                                <Input 
                                    className={"w-full outline-none bg-transparent p-3 pl-10 -ml-10 placeholder:text-stone-400"} 
                                    placeholder="Supernotes API Key" />
                            </TextField>
                        </div>
                    }
                    authenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg" 
                            onPress={() => updateSupernotesAPIKey(undefined)}>
                            Log Out
                        </Button>
                    }
                />
                <BridgeItem
                    id="google-drive"
                    name="Google Drive"
                    authStatus={(useCell("extensions", "google-drive", "authStatus") as string | undefined) === "authenticated" ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSynced={useCell("extensions", "google-drive", "lastSyncedAt") as number | undefined}
                    lastSyncedTried={useCell("extensions", "google-drive", "lastTriedSyncedAt") as number | undefined}
                    unauthenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg"
                            onPress={() => router.push(generateGoogleAuthURL())}>
                            Authenticate with Google
                        </Button>
                    }
                    authenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg" 
                            onPress={() => {
                                removeGoogleAuth()
                                updateGoogleAuthStatus("unauthenticated")
                            }}
                        >
                            Log Out
                        </Button>
                    }
                />
                <BridgeItem
                    id="spotify"
                    name="Spotify"
                    authStatus={(useCell("extensions", "spotify", "authStatus") as string | undefined) === "authenticated" ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSyncedTried={useCell("extensions", "spotify", "lastTriedSyncedAt") as number | undefined}
                    lastSynced={useCell("extensions", "spotify", "lastSyncedAt") as number | undefined}
                    unauthenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg"
                            onPress={() => {redirectSpotifyAuth()}}>
                            Authenticate with Spotify
                        </Button>
                    }
                    authenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg" 
                            onPress={() => {
                                removeSpotifyAuth()
                                updateSpotifyAuthStatus("unauthenticated")
                            }}
                        >
                            Log Out
                        </Button>
                    }
                />
                <BridgeItem
                    id="notion"
                    name="Notion"
                    authStatus={(useCell("extensions", "notion", "authStatus") as string | undefined) === "authenticated" ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSynced={useCell("extensions", "notion", "lastSyncedAt") as number | undefined}
                    unauthenticatedChildren={
                        <div className="flex flex-col gap-4">
                            <FileTrigger
                                onSelect={(e) => {
                                    // const extension = orchestrator.extensions.find(e => e.id == "notion")
                                    // const ingestion = extension?.ingestionMethods?.find(im => im.id == "notion-export") as ManualIngestionMethod<NoPrereq, FileSyncInfo> | undefined
                                    // const file = e?.[0]
                                    // console.log("starting notion export ingest, file = ", file, "ingestion = ", ingestion, "extension = ", extension)
                                    // if(file && ingestion) ingestion.trySync({ file })
                                }}>
                                <Button 
                                    kind="secondary" 
                                    size="lg">
                                    Upload Notion Export
                                </Button>
                            </FileTrigger>
                            <TextField 
                                className={"w-full bg-white shadow-outset rounded-xl flex items-center"}
                                value={(notionUserID as string | undefined) ?? ""}
                                onChange={v => updateNotionUserID(v)}
                                >
                                <Label className="sr-only">Notion User ID</Label>
                                <CodeSimple className="text-stone-400 text-xl m-3"/>
                                <Input 
                                    className={"w-full outline-none bg-transparent p-3 pl-10 -ml-10 placeholder:text-stone-400"} 
                                    placeholder="Notion User ID" />
                            </TextField>
                            <TextField 
                                className={"w-full bg-white shadow-outset rounded-xl flex items-center"}
                                value={(notionAPIKey as string | undefined) ?? ""}
                                onChange={v => updateNotionAPIKey(v)}
                                >
                                <Label className="sr-only">Notion API Key</Label>
                                <CodeSimple className="text-stone-400 text-xl m-3"/>
                                <Input 
                                    className={"w-full outline-none bg-transparent p-3 pl-10 -ml-10 placeholder:text-stone-400"} 
                                    placeholder="Notion API Key" />
                            </TextField>
                        </div>
                    }
                    authenticatedChildren={<div></div>}
                />
            </div>
            <Button 
                kind="secondary" 
                size="lg"
                onPress={() => {
                    sharedStore?.delTables()
                    secureStore?.delTables()
                }}
            >
                Reset all data
            </Button>
            <Inspector/>
        </Container>
    )
}

enum AuthStatus { Authenticated = "Authenticated", Unauthenticated = "Unauthenticated", Authenticating = "Authenticating", Error = "Error" }
interface BridgeItemProps {
    id: string,
    name: string,
    icon?: React.ReactNode,
    authStatus: AuthStatus,
    lastSyncedTried?: number,
    lastSynced?: number,
    authenticatedChildren: React.ReactNode,
    authenticatingChildren?: React.ReactNode,
    unauthenticatedChildren: React.ReactNode,
}
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' })
function BridgeItem({ id, name, icon, authStatus, lastSynced, lastSyncedTried, authenticatedChildren, unauthenticatedChildren } : BridgeItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    const syncText = (lastSyncedTried && (!lastSynced || (lastSyncedTried > lastSynced))) 
        ? `Syncing...` 
        : lastSynced 
            ? `Synced at ${dateTimeFormatter.format(lastSynced)}`
            : `Not synced yet`
    return (
        <div className="flex flex-col gap-4 -mx-4">
            <div className="flex p-4 gap-4 items-center hover:bg-neutral-100 rounded-lg cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <LogoForSource source={id} className="w-8 h-8 rounded-lg"/>
                <div className="flex flex-col flex-grow">
                    <h2 className="font-semibold">{name}</h2>
                    <p className="text-stone-400">{authStatus} • {syncText}</p>
                </div>
                <CaretRight className={`transform transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}/>
            </div>
            {isOpen && authStatus == AuthStatus.Authenticated && <div className="flex flex-col gap-1 pl-16">{authenticatedChildren}</div>}
            {isOpen && authStatus == AuthStatus.Authenticating && <div className="flex flex-col gap-1 pl-16">{authenticatedChildren ?? <p>Authenticating...</p>}</div>}
            {isOpen && authStatus == AuthStatus.Unauthenticated && <div className="flex flex-col gap-1 pl-16">{unauthenticatedChildren}</div>}
        </div>
    )
}

function Header() {
    return (
        <div className="flex items-center -m-2">
            <Link href="/" className="flex gap-3">
                <div className="size-8 rounded-lg flex items-center justify-center bg-neutral-100 border border-neutral-300 text-neutral-500">
                    <Bridge size={24}/>
                </div>
                <h1 className="text-4xl/[50px] font-serif font-semibold tracking-tight grow text-neutral-500">Skybridge •</h1>
            </Link>
            <h1 className="text-4xl/[50px] font-serif font-semibold tracking-tight grow">Bridges</h1>
        </div>
    )
}