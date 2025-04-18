import { SpotifyListenTimelineItem, SpotifyPlaylistTimelineItem } from "../../data/timeline/converters/spotifyconverter";
import { BasicTimelineView } from "./DefaultTimelineView";

export function SpotifyPlaylistTimelineView({ item }: { item: SpotifyPlaylistTimelineItem }) {
    return (
        <BasicTimelineView item={item}>
            <div className="flex gap-2 items-center">
                <p className="text-neutral-500">
                    <span>Added </span> 
                    <img src={item.track.track.album.images[0]?.url} className="inline-block size-4 rounded-md bg-neutral-100 -mt-1 mr-[3px] ml-1"></img>
                    <span className="text-neutral-900">{item.track.track.name}</span>
                    <span> to </span>
                    <img src={item.playlist.images[0]?.url} className="inline-block size-4 rounded-md bg-neutral-100 -mt-1 mr-[3px] ml-1"></img>
                    <span className="text-neutral-900">{item.playlist.name}</span>
                </p>
            </div>
        </BasicTimelineView>
    )
}

export function SpotifyListenTimelineView({ item }: { item: SpotifyListenTimelineItem }) {
    if(!("album" in item.listen.track)) return <BasicTimelineView item={item}><p>Played {item.listen.track.trackName} by {item.listen.track.artistName}</p></BasicTimelineView>
    return (
        <BasicTimelineView item={item}>
            <div className="flex gap-2 items-center">
                <p className="text-neutral-500">
                    <span>Played </span> 
                    <img src={item.listen.track.album.images[0]?.url} className="inline-block size-4 rounded-md bg-neutral-100 -mt-1 mr-[3px] ml-1"></img>
                    <span className="text-neutral-900">{item.listen.track.name}</span>
                    <span> by </span>
                    <span className="text-neutral-900">{item.listen.track.artists.map(a => a.name).join(", ")}</span>
                </p>
            </div>
        </BasicTimelineView>
    )
}

