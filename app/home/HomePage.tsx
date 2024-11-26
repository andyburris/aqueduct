"use client"

import { Container } from "@/app/common/Container";
import { Bridge, GearSix } from "@phosphor-icons/react";
import { useRowIds, useTable } from "tinybase/ui-react";
import { NoteItem } from "./NoteItem";
import { Button, Link } from "../common/Components";

export function HomePage() {
    return (
        <Container>
            <Header/>
            <Notes/>
        </Container>
    )
}

function Header() {
    return (
        <div className="flex gap-3 items-center">
            <div className="size-8 rounded-lg flex items-center justify-center bg-neutral-100 border border-neutral-300 text-neutral-500">
                <Bridge size={24}/>
            </div>
            <h1 className="text-4xl/[50px] font-serif font-semibold tracking-tight grow">Skybridge</h1>
            <Link kind="secondary" href="/bridges">
                <GearSix/>
            </Link>
        </div>
    )
}

function Notes() {
    const notesRows = useRowIds("notes")
    const table = useTable("notes")
    return (
        <div className="flex flex-col gap-2">
            { notesRows.map((rowId) => {
                const note: Note = table[rowId] as unknown as Note
                return <NoteItem note={note} key={note.id} />
            }) }
        </div>
    )
}