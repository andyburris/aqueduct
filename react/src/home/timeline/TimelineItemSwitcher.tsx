import { TimelineItem } from "../../data/timeline/timeline";
import { DefaultTimelineView } from "./DefaultTimelineView";
import { SpotifyPlaylistTimelineView } from "./SpotifyTimelineView";
import { SpotifyPlaylistTimelineItem } from "../../data/timeline/converters/spotifyconverter";

export function TimelineItemSwitcher({ item }: { item: TimelineItem }) {
    if (item instanceof SpotifyPlaylistTimelineItem) return <SpotifyPlaylistTimelineView item={item}/>
    else return <DefaultTimelineView item={item}/>
}