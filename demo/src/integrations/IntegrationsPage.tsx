"use client"

import { CodeSimple } from "@phosphor-icons/react";
import { FileStream } from "jazz-tools";
import { useAccount } from "jazz-tools/react";
import { FileTrigger, Input, Label, TextField } from "react-aria-components";
import { generateGoogleAuthURL } from "../auth/google/googleauth";
import { redirectSpotifyAuth } from "../auth/spotify/spotifyauth";
import { Button, Link } from "../common/Components";
import { Container } from "../common/Container";
import { FountainLogo } from "../common/FountainLogo";
import { Header } from "../common/Header";
import { FlowStepItem, IntegrationItem, SyncedAtFlowStepItem } from "./IntegrationItem";
import { FountainUserAccount, ProcessFile } from "../../jazz";

export function IntegrationsPage() {
    const { me } = useAccount(FountainUserAccount, { resolve: { root: { integrations: {
        spotifyIntegration: { playlists: { items: true }, listeningHistory: { fileInProcess: true, listens: true } },
        tanaIntegration: { isolatedNodes: { $each: true }, inProcess: true, },
        // googleIntegration: { authentication: {}, locations: { items: true }, files: { items: true }, photos: { items: true } },
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
                <IntegrationItem
                    id="supernotes"
                    name="Supernotes"
                    flows={[{
                        name: "API Key",
                        children: <div className="flex flex-col gap-4">
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
                            <Button 
                                kind="secondary" 
                                size="lg" 
                                onPress={() => {}}>
                                Log Out
                            </Button>
                        </div>,
                        isConnected: false,
                    }]}
                />
                {/* <IntegrationItem
                    id="google-drive"
                    name="Google Drive"
                    flows={[{
                        name: "Log in to Drive",
                        isConnected: integrations.googleIntegration.authentication.credentials !== undefined,
                        children: <div className="flex flex-col gap-4">
                            <FlowStepItem
                                text="Log in to Google Drive"
                                state={integrations.googleIntegration.authentication.credentials !== undefined ? "done" : "undone"}
                                undoneChildren={
                                    <Button 
                                        kind="secondary" 
                                        size="lg"
                                        onPress={() => window.open(generateGoogleAuthURL())}>
                                        Authenticate with Google
                                    </Button>
                                }
                                doneChildren={
                                    <Button 
                                        kind="secondary" 
                                        size="lg" 
                                        onPress={() => {
                                            integrations.googleIntegration.authentication.credentials = undefined
                                            integrations.googleIntegration.authentication.code = undefined
                                        }}>
                                        Log Out
                                    </Button>
                                }
                            />
                            <SyncedAtFlowStepItem
                                lastSyncStarted={integrations.googleIntegration.files.lastSyncStarted?.getTime()}
                                lastSyncFinished={integrations.googleIntegration.files.lastSyncFinished?.getTime()}
                                state={integrations.googleIntegration.files.items.length > 0 ? "done" : "undone"}
                                doneChildren={
                                    <Button 
                                        kind="secondary" 
                                        size="md" 
                                        onPress={() => integrations.googleIntegration.files.items.applyDiff([])}
                                    >
                                        Reset
                                    </Button>
                                }
                            />
                        </div>,
                    }]}
                />
                <IntegrationItem
                    id="google-photos"
                    name="Google Photos"
                    flows={[
                        {
                            name: "Photos",
                            isConnected: integrations.googleIntegration.photos.items.length > 0,
                            children: <div className="flex flex-col gap-4">
                                <FlowStepItem
                                    text="Log in to Google Drive"
                                    state={integrations.googleIntegration.authentication.credentials !== undefined ? "done" : "undone"}
                                />
                                <FlowStepItem
                                    text="Export Google Takeout file to Drive"
                                    secondaryText="You can get your Google Takeout file at takeout.google.com. Be sure to export it to your Google Drive."
                                    state={integrations.googleIntegration.files.items.some(i => i.name?.startsWith("takeout-") && i.name?.endsWith(".zip")) ? "done" : "undone"}
                                    undoneChildren={
                                        <Link 
                                            kind="secondary"
                                            size="md"
                                            to="https://takeout.google.com/"
                                            target="_blank"
                                            rel="noreferrer"
                                        >Export your Google Takeout data</Link>
                                    }
                                />
                                <SyncedAtFlowStepItem
                                    lastSyncStarted={integrations.googleIntegration.photos.lastSyncStarted?.getTime()} 
                                    lastSyncFinished={integrations.googleIntegration.photos.lastSyncFinished?.getTime()} 
                                    state={integrations.googleIntegration.photos.items.length > 0 ? "done" : "undone"}
                                />
                            </div>
                        }
                    ]}
                />
                <IntegrationItem
                    id="google-maps"
                    name="Location History"
                    flows={[
                        {
                            name: "Location History",
                            children: <div className="flex flex-col gap-3">
                                <FlowStepItem
                                    text="Upload export file"
                                    secondaryText="You can get your location history in the Google Maps app by going to Timeline -> Location History -> Manage Location History -> Export Location History"
                                    state={(integrations.googleIntegration.locations.items.length > 0 || integrations.googleIntegration.locations.fileInProcess) ? "done" : "undone"}
                                    inProgress={integrations.googleIntegration.locations.fileInProcess !== undefined}
                                    children={
                                        <FileTrigger 
                                            allowsMultiple={false}
                                            onSelect={async l => {
                                                const file = l?.[0]
                                                if(!file) return
                                                const json = JSON.parse(await file.text())
                                                integrations.googleIntegration.locations.fileInProcess = json
                                                integrations.googleIntegration.locations.lastSyncStarted = new Date()
                                            }}
                                        >
                                            <Button 
                                                kind="secondary" 
                                                size="md"
                                                >
                                                Upload <span className="font-mono">location-history.json</span> file
                                            </Button>
                                        </FileTrigger>
                                    }
                                    doneChildren={
                                        <Button 
                                            kind="secondary" 
                                            size="md" 
                                            onPress={() => { integrations.googleIntegration.locations.items.applyDiff([]) }}
                                        >
                                            Reset
                                        </Button>
                                    }
                                />
                                <SyncedAtFlowStepItem
                                    lastSyncStarted={integrations.googleIntegration.locations.lastSyncStarted?.getTime()} 
                                    lastSyncFinished={integrations.googleIntegration.locations.lastSyncFinished?.getTime()} 
                                    state={integrations.googleIntegration.locations.items.length > 0 ? "done" : "undone"} 
                                />
                            </div>,
                            isConnected: integrations.googleIntegration.locations.items.length > 0 || integrations.googleIntegration.locations.fileInProcess !== undefined,
                        }
                    ]}
                /> */}
                <IntegrationItem
                    id="spotify"
                    name="Spotify"
                    flows={[
                        {
                            name: "Playlists",
                            isConnected: integrations.spotifyIntegration.authentication !== undefined,
                            children: <div className="flex flex-col gap-3">
                                <FlowStepItem
                                    text="Log in with Spotify"
                                    state={integrations.spotifyIntegration.authentication !== undefined ? "done" : "undone"}
                                    undoneChildren={
                                        <Button 
                                            kind="secondary" 
                                            size="lg"
                                            onPress={() => {redirectSpotifyAuth()}}>
                                            Authenticate with Spotify
                                        </Button>
                                    }
                                    doneChildren={
                                        <Button 
                                            kind="secondary" 
                                            size="lg" 
                                            onPress={() => {
                                                integrations.spotifyIntegration.applyDiff({
                                                    authentication: undefined,
                                                    lastSyncedAt: undefined,
                                                    lastTriedSyncedAt: undefined,
                                                })
                                                integrations.spotifyIntegration.playlists.items.applyDiff([])
                                            }}
                                        >
                                            Log Out
                                        </Button>
                                    }
                                />
                                <SyncedAtFlowStepItem
                                    lastSyncStarted={integrations.spotifyIntegration.playlists.lastSyncStarted?.getTime()} 
                                    lastSyncFinished={integrations.spotifyIntegration.playlists.lastSyncFinished?.getTime()} 
                                    state={integrations.spotifyIntegration.playlists.items.length > 0 !== undefined ? "done" : "undone"}
                                />
                            </div>,
                        },
                        {
                            name: "Listening History",
                            isConnected: (integrations.spotifyIntegration.listeningHistory.listens.length > 0) || (integrations.spotifyIntegration.listeningHistory.fileInProcess !== undefined),
                            children: <div className="flex flex-col gap-3">
                                <FlowStepItem
                                    text="Upload export file"
                                    secondaryText="Get earlier listens in your Spotify privacy settings. Takes up to 30 days for your first export."
                                    state={integrations.spotifyIntegration.listeningHistory.fileInProcess ? "done" : "undone"}
                                    children={
                                        <div className="flex gap-2">
                                            <FileTrigger 
                                                allowsMultiple={false}
                                                onSelect={async f => {
                                                    integrations.spotifyIntegration.listeningHistory.fileInProcess = await FileStream.createFromBlob(f![0]!, { owner: integrations._owner })
                                                }}
                                            >
                                                <Button 
                                                    kind="secondary" 
                                                    size="md">
                                                    Upload <span className="font-mono">my_spotify_data.zip</span> file
                                                </Button>
                                            </FileTrigger>

                                            <Link
                                                kind="secondary"
                                                size="md"
                                                to="https://www.spotify.com/us/account/privacy/"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Spotify Privacy Settings
                                            </Link>
                                        </div>
                                    }
                                />
                                <SyncedAtFlowStepItem
                                    lastSyncStarted={integrations.spotifyIntegration.listeningHistory.lastSyncStarted?.getTime()} 
                                    lastSyncFinished={integrations.spotifyIntegration.listeningHistory.lastSyncFinished?.getTime()} 
                                    state={integrations.spotifyIntegration.listeningHistory.listens.length > 0 ? "done" : "undone"}
                                    doneChildren={
                                        <Button 
                                            kind="secondary" 
                                            size="md" 
                                            onPress={() => integrations.spotifyIntegration.listeningHistory.listens.applyDiff([])}
                                        >
                                            Reset
                                        </Button>
                                    }
                                />
                            </div>
                        }
                    ]}
                />
                <IntegrationItem
                    id="tana"
                    name="Tana"
                    flows={[{
                        name: "Tana Export",
                        isConnected: integrations.tanaIntegration.isolatedNodes.length > 0 || integrations.tanaIntegration.inProcess !== undefined,
                        children: <div className="flex flex-col gap-4">
                            <FileTrigger
                                onSelect={async (files) => {
                                    if(!files || files.length === 0) return
                                    const file = files[0]
                                    integrations.tanaIntegration.inProcess = ProcessFile.create({
                                        lastUpdate: new Date(),
                                        file: await FileStream.createFromBlob(file, integrations._owner),
                                    }, integrations._owner)
                                }}
                            >
                                <Button 
                                    kind="secondary" 
                                    size="lg">
                                    Upload Tana Export
                                </Button>
                            </FileTrigger>
                            <Button 
                                kind="secondary" 
                                size="lg"
                                onPress={() => integrations.tanaIntegration.isolatedNodes.applyDiff([])}>
                                Reset Tana nodes
                            </Button>
                        </div>,
                    }]}
                />

                <IntegrationItem
                    id="notion"
                    name="Notion"
                    flows={[{
                        name: "Notion Export",
                        isConnected: false,
                        children: <div className="flex flex-col gap-4">
                            <FileTrigger
                                onSelect={(e) => {
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
                        </div>,
                    }]}
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