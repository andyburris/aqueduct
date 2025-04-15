import { TimelineItem } from "../../data/timeline/timeline";
import { DefaultTimelineView } from "./DefaultTimelineView";
import { SpotifyListenTimelineView, SpotifyPlaylistTimelineView } from "./SpotifyTimelineView";
import { SpotifyListenTimelineItem, SpotifyPlaylistTimelineItem } from "../../data/timeline/converters/spotifyconverter";

export function TimelineItemSwitcher({ item }: { item: TimelineItem }) {
    if (item instanceof SpotifyPlaylistTimelineItem) return <SpotifyPlaylistTimelineView item={item}/>
    else if (item instanceof SpotifyListenTimelineItem) return <SpotifyListenTimelineView item={item}/>
    else return <DefaultTimelineView item={item}/>
}