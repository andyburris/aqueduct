import { SpotifyPlaylistTimelineItem } from "@/app/data/timeline/converters/spotifyconverter";
import { BasicTimelineView } from "./DefaultTimelineView";

export function SpotifyPlaylistTimelineView({ item }: { item: SpotifyPlaylistTimelineItem }) {
    return (
        <BasicTimelineView item={item}>
            <p className="text-neutral-500">
                Added <span className="text-neutral-900">{item.track.track.name}</span> to <span className="text-neutral-900">{item.playlist.name}</span>
            </p>
        </BasicTimelineView>
    )
}