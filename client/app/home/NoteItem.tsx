export function NoteItem({ note }: { note: Note }) {
    return (
        <div className="flex-col p-4 border border-neutral-200 rounded-2xl">
            { note.title && <p className="font-semibold">{note.title}</p> }
            <p className="whitespace-pre-wrap">{note.content}</p>
        </div>
    )
}