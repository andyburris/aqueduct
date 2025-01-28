"use client"

import { Bridge, CaretRight, CodeSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileTrigger, Input, Label, TextField } from "react-aria-components";
import { useCell, useDelRowCallback, useSetCellCallback, useSetRowCallback, useTable } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { Button, Link } from "../common/Components";
import { Container } from "../common/Container";
import { PageProvider } from "../page";
import { Row } from "tinybase";

export default function Page() {
    return (
        <PageProvider>
            <BridgesPage/>
        </PageProvider>
    )
}

function generateOAuthState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}
function createGoogleAuthUrl(clientId: string, redirectUri: string, state: string) {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const scopes = [
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ].join(' ');
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline', // ensures you get a refresh token
      state: state,
      prompt: 'consent' // ensures you always get a refresh token
    });
  
    return `${baseUrl}?${params.toString()}`;
}

function BridgesPage() {
    const router = useRouter()
    const extensionSettings = useTable("extensions")

    const supernotesAPIKey = useCell("auth", "supernotes", "apiKey", "secure")
    const updateSupernotesAPIKey = useSetCellCallback("auth", "supernotes", "apiKey", (v: string) => v,  [], "secure")

    const notionUserID = useCell("auth", "notion", "activeUserID", "secure")
    const updateNotionUserID = useSetCellCallback("auth", "notion", "activeUserID", (v: string) => v,  [], "secure")

    const notionAPIKey = useCell("auth", "notion", "apiKey", "secure")
    const updateNotionAPIKey = useSetCellCallback("auth", "notion", "apiKey", (v: string) => v,  [], "secure")

    const removeGoogleAuth = useDelRowCallback("auth", "google-drive", "secure")
    const updateGoogleAuthStatus = useSetCellCallback("extensions", "google-drive", "authStatus", (v: string) => v, [])

    return (
        <Container>
            <Header/>
            <div className="flex flex-col">
                <BridgeItem
                    name="Supernotes"
                    authStatus={(useCell("extensions", "supernotes", "authStatus") as string | undefined) === "authenticated" ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSynced={useCell("extensions", "supernotes", "lastSynced") as number | undefined}
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
                    name="Google Drive"
                    authStatus={(useCell("extensions", "google-drive", "authStatus") as string | undefined) === "authenticated" ? AuthStatus.Authenticated : AuthStatus.Unauthenticated}
                    lastSynced={useCell("extensions", "google-drive", "lastSynced") as number | undefined}
                    unauthenticatedChildren={
                        <Button 
                            kind="secondary" 
                            size="lg"
                            onPress={() => {
                                const state = generateOAuthState()
                                const googleAuthURL = createGoogleAuthUrl(
                                    "627322331663-plf372lgh0e4ocsimmg1t8pj4mc7b0ub.apps.googleusercontent.com", 
                                    "https://localhost:3000/auth/google",
                                    state
                                )
                                localStorage.setItem('oauth_state', state)
                                router.push(googleAuthURL)
                            }}>
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
                <div className="flex flex-col gap-1">
                    <p>Notion</p>
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
            </div>
            <Inspector/>
        </Container>
    )
}

enum AuthStatus { Authenticated = "Authenticated", Unauthenticated = "Unauthenticated", Authenticating = "Authenticating", Error = "Error" }
interface BridgeItemProps {
    name: string,
    iconSrc?: string,
    authStatus: AuthStatus,
    lastSynced?: number,
    authenticatedChildren: React.ReactNode,
    authenticatingChildren?: React.ReactNode,
    unauthenticatedChildren: React.ReactNode,
}
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' })
function BridgeItem({ name, iconSrc, authStatus, lastSynced, authenticatedChildren, unauthenticatedChildren } : BridgeItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex flex-col gap-4 -mx-4">
            <div className="flex p-4 gap-4 items-center hover:bg-neutral-100 rounded-lg cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                { iconSrc
                    ? <img src={iconSrc} alt={`${name} icon`} className="w-8 h-8"/>
                    : <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">{name[0]}</div>
                }
                <div className="flex flex-col flex-grow">
                    <h2 className="font-semibold">{name}</h2>
                    <p className="text-stone-400">{authStatus}{lastSynced ? ` • Last synced at ${dateTimeFormatter.format(lastSynced)}` : ""}</p>
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