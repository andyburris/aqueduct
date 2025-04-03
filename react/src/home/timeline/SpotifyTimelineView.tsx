import { SpotifyPlaylistTimelineItem } from "../../data/timeline/converters/spotifyconverter";
import { BasicTimelineView } from "./DefaultTimelineView";

export function SpotifyPlaylistTimelineView({ item }: { item: SpotifyPlaylistTimelineItem }) {
    return (
        <BasicTimelineView item={item}>
            <div className="flex gap-2 items-center">
                <p className="text-neutral-500">
                    <span>Added </span> 
                    <img src={item.track.track.album.images[0]?.url} className="inline-block size-4 rounded-md bg-neutral-100 -mt-1 mr-0.5 ml-1"></img>
                    <span className="text-neutral-900">{item.track.track.name}</span>
                    <span> to </span>
                    <img src={item.playlist.images[0]?.url} className="inline-block size-4 rounded-md bg-neutral-100 -mt-1 mr-0.5 ml-1"></img>
                    <span className="text-neutral-900">{item.playlist.name}</span>
                </p>
            </div>
        </BasicTimelineView>
    )
}