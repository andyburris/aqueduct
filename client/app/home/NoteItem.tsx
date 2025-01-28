import { GoogleDriveLogo, LogoForSource, SpotifyLogo } from "../common/Logos"

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' })

export function NoteItem({ note }: { note: Note }) {
    return (
        <div className="flex-col p-4 border border-neutral-200 rounded-2xl">
            { note.title && <p className="font-semibold">{note.title}</p> }
            <p className="whitespace-pre-wrap">{note.content}</p>
            <div className="flex items-end justify-between">
                <LogoForSource source={note.source} className="w-6 h-6 rounded-md"/>
                <div className="flex flex-col items-end">
                    <p className="text-neutral-500 text-sm">Updated {dateTimeFormatter.format(note.editedTimestamp)}</p>
                    <p className="text-neutral-500 text-sm">Created {dateTimeFormatter.format(note.createdTimestamp)}</p>
                </div>
            </div>
        </div>
    )
}