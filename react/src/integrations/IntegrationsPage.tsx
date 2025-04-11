"use client"

import { CaretRight, CodeSimple } from "@phosphor-icons/react";
import { useAccount } from "jazz-react";
import { useState } from "react";
import { FileTrigger, Input, Label, TextField } from "react-aria-components";
import { generateGoogleAuthURL } from "../auth/google/googleauth";
import { redirectSpotifyAuth } from "../auth/spotify/spotifyauth";
import { Button, Link } from "../common/Components";
import { Container } from "../common/Container";
import { FountainLogo } from "../common/FountainLogo";
import { Header } from "../common/Header";
import { LogoForSource } from "../common/Logos";

export function IntegrationsPage() {
    const { me } = useAccount({ resolve: { root: { integrations: {
        spotifyIntegration: { playlists: true },
        googleIntegration: { authentication: {}, locations: { items: true }, },
    } }}})
    if(!me) return <p>Loading...</p>
    const integrations = me.root.integrations

    return (
        <Container>
            <Header>
                <Link kind="ghost" to="/" className="-ml-2 -mr-3 -my-1">
                    <FountainLogo />
                </Link>
                <p className="text-2xl font-serif font-semibold tracking-tight">• Integrations</p>
            </Header>
            <div className="flex flex-col px-5">
                <BridgeItem
                    id="supernotes"
                    name="Supernotes"
                    authStatus={AuthStatus.Unauthenticated}
                    lastSynced={undefined}
                    unauthenticatedChildren={
                        <div className="flex flex-col gap-4">
                            <p>1. Get your Supernotes API Key at <a href="https://my.supernotes.app" target="_blank" rel="noreferrer">my.supernotes.app</a> → Settings → API & Integrations → Manage API Keys</p>
                            <p>2. Add the API key you generated to Skybridge</p>
                            <TextField 
                                className={"w-full bg-white shadow-outset rounded-xl flex items-center"}
                                value={""}
                                onChange={v => {}}
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
                            onPress={() => {}}>
                            Log Out
                        </Button>
                    }
                />
                <BridgeItem
                    id="google-drive"
                    name="Google Drive"
                    authStatus={
                        integrations.googleIntegration.authentication.credentials ? AuthStatus.Authenticated
                        : integrations.googleIntegration.authentication.code ? AuthStatus.Authenticating
                        : AuthStatus.Unauthenticated}
                    lastSynced={integrations.googleIntegration.lastSyncedAt?.getTime()}
                    lastSyncedTried={integrations.googleIntegration.lastTriedSyncedAt?.getTime()}
                    unauthenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg"
                            onPress={() => window.open(generateGoogleAuthURL()) }>
                            Authenticate with Google
                        </Button>
                    }
                    authenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg" 
                            onPress={() => {
                                // removeGoogleAuth()
                                // updateGoogleAuthStatus("unauthenticated")
                            }}
                        >
                            Log Out
                        </Button>
                    }
                />
                <BridgeItem
                    id="google-maps"
                    name="Location History"
                    authStatus={integrations.googleIntegration.locations.items.length > 0 ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSynced={undefined}
                    lastSyncedTried={undefined}
                    unauthenticatedChildren={
                        <FileTrigger 
                            allowsMultiple={false}
                            onSelect={async l => {
                                const file = l?.[0]
                                if(!file) return
                                const json = JSON.parse(await file.text())
                                integrations.googleIntegration.locations.fileInProcess = json
                            }}
                        >
                            <Button 
                                kind="secondary" 
                                size="lg"
                                >
                                Upload <span className="font-mono">location-history.json</span> file
                            </Button>
                        </FileTrigger>
                    }
                    authenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg" 
                            onPress={() => { integrations.googleIntegration.locations.items.applyDiff([]) }}
                        >
                            Reset
                        </Button>
                    }
                />
                <BridgeItem
                    id="spotify"
                    name="Spotify"
                    authStatus={integrations.spotifyIntegration.authentication ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSyncedTried={integrations.spotifyIntegration.lastSyncedAt?.getTime()}
                    lastSynced={integrations.spotifyIntegration.lastTriedSyncedAt?.getTime()}
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
                                integrations.spotifyIntegration.applyDiff({
                                    authentication: undefined,
                                    lastSyncedAt: undefined,
                                    lastTriedSyncedAt: undefined
                                })
                                integrations.spotifyIntegration.playlists?.applyDiff([])
                            }}
                        >
                            Log Out
                        </Button>
                    }
                />
                <BridgeItem
                    id="notion"
                    name="Notion"
                    authStatus={AuthStatus.Unauthenticated}
                    lastSynced={undefined}
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
                                value={""}
                                onChange={v => {}}
                                >
                                <Label className="sr-only">Notion User ID</Label>
                                <CodeSimple className="text-stone-400 text-xl m-3"/>
                                <Input 
                                    className={"w-full outline-none bg-transparent p-3 pl-10 -ml-10 placeholder:text-stone-400"} 
                                    placeholder="Notion User ID" />
                            </TextField>
                            <TextField 
                                className={"w-full bg-white shadow-outset rounded-xl flex items-center"}
                                value={""}
                                onChange={v => {}}
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
                    // sharedStore?.delTables()
                    // secureStore?.delTables()
                }}
            >
                Reset all data
            </Button>
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
function BridgeItem({ id, name, authStatus, lastSynced, lastSyncedTried, authenticatedChildren, unauthenticatedChildren } : BridgeItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    const syncText = (lastSyncedTried && (!lastSynced || (lastSyncedTried > lastSynced))) 
        ? `Syncing...` 
        : lastSynced 
            ? `Synced at ${dateTimeFormatter.format(lastSynced)}`
            : `Not synced yet`
    return (
        <div className="flex flex-col -mx-4">
            <div className="flex p-4 gap-4 items-center hover:bg-neutral-100 rounded-lg cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <LogoForSource source={id} className="w-8 h-8 rounded-lg border border-neutral-200"/>
                <div className="flex flex-col flex-grow">
                    <h2 className="font-semibold">{name}</h2>
                    <p className="text-stone-400">{authStatus} • {syncText}</p>
                </div>
                <CaretRight className={`transform transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}/>
            </div>
            {isOpen && authStatus == AuthStatus.Authenticated && <div className="flex flex-col gap-1 pl-16 py-4">{authenticatedChildren}</div>}
            {isOpen && authStatus == AuthStatus.Authenticating && <div className="flex flex-col gap-1 pl-16 py-4">{authenticatedChildren ?? <p>Authenticating...</p>}</div>}
            {isOpen && authStatus == AuthStatus.Unauthenticated && <div className="flex flex-col gap-1 pl-16 py-4">{unauthenticatedChildren}</div>}
        </div>
    )
}