"use client"

import { Bridge, CodeSimple } from "@phosphor-icons/react";
import { FileTrigger, Input, Label, TextField } from "react-aria-components";
import { useCell, useSetCellCallback, useTable } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { Button, Link } from "../common/Components";
import { Container } from "../common/Container";
import { PageProvider } from "../page";

export default function Page() {
    return (
        <PageProvider>
            <BridgesPage/>
        </PageProvider>
    )
}

function BridgesPage() {
    const extensionSettings = useTable("extensions")

    const supernotesAPIKey = useCell("extensions", "supernotes", "apiKey")
    const updateSupernotesAPIKey = useSetCellCallback("extensions", "supernotes", "apiKey", (v: string) => v)

    const notionUserID = useCell("extensions", "notion", "activeUserID")
    const updateNotionUserID = useSetCellCallback("extensions", "notion", "activeUserID", (v: string) => v)

    const notionAPIKey = useCell("extensions", "notion", "apiKey")
    const updateNotionAPIKey = useSetCellCallback("extensions", "notion", "apiKey", (v: string) => v)
    return (
        <Container>
            <Header/>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <p>Supernotes</p>
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