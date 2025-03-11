"use client"

import { Container } from "@/app/common/Container";
import { GearSix } from "@phosphor-icons/react";
import { useAccount, useAccountOrGuest } from "jazz-react";
import { Link } from "../common/Components";
import { FountainLogo } from "../common/FountainLogo";
import { Header } from "../common/Header";
import { SpotifyPlaylistTimelineItem } from "../data/timeline/converters/spotifyconverter";
import { MOCK_PLAYLISTS } from "./mocks";
import { TimelineItemSwitcher } from "./timeline/TimelineItemSwitcher";
import { TimelineItem } from "../data/timeline/timeline";
import { DayItem } from "./DayItem";
import { TimeGapView } from "./TimeGapView";

export function HomePage() {
    return (
        <Container>
            <Header>
                <FountainLogo className="grow"/>
                <Link kind="secondary" href="/integrations">
                    <GearSix/>
                </Link>
            </Header>
            <Timeline/>
        </Container>
    )
}

function Timeline() {
    // const { me } = useAccount({ root: { spotifyIntegration: { playlists: [] }}})
    const { me } = useAccount({})
    const { me: me2 } = useAccount({ root: {} })
    console.log("me", me)
    console.log("me.root", me?.root)
    console.log("me2", me2)
    if (!me) return <p>Loading...</p>
    // const spotifyTimelineItems: SpotifyPlaylistTimelineItem[] = me.root.spotifyIntegration?.playlists
    //     ?.flatMap(playlist => SpotifyPlaylistTimelineItem.playlistToTimelineItems(playlist))
    //     ?? []
    const spotifyTimelineItems: SpotifyPlaylistTimelineItem[] = MOCK_PLAYLISTS
        .flatMap(playlist => SpotifyPlaylistTimelineItem.playlistToTimelineItems(playlist))
    
    const allTimelineItems = [
        ...spotifyTimelineItems
    ]
    const withDays = insertDays(allTimelineItems)

    return (
        <div className="flex flex-col gap-6 px-5 overflow-y-auto">
            {/* { dates.map(date => <DayItem date={date} className="p-4"/> )} */}
            { withDays.map(item => {
                if(item instanceof TimeGap) return <TimeGapView gap={item} key={`${item.startDate?.toISOString()}-${item.endDate?.toISOString()}`}/>
                else if (isTimelineItem(item)) return <TimelineItemSwitcher item={item} key={`${item.source}/${item.type}/${item.id}`}/>
                else return <DayItem date={item} key={item.toISOString()}/>
            }) }
        </div>
    )
}

export class TimeGap { constructor (public startDate: Date | null, public endDate: Date | null) {}}
export type ViewItem = TimelineItem | Date | TimeGap
function isTimelineItem(item: ViewItem): item is TimelineItem {
    return "id" in item
}
function insertDays(timelineItems: TimelineItem[]): ViewItem[] {
    const outItems: ViewItem[] = []
    const sortedAscending = timelineItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    sortedAscending.forEach(ti => {
        if(outItems.length == 0) {
            // if empty, push first date and item
            outItems.push(new TimeGap(null, new Date(new Date(ti.timestamp).setHours(0, 0, 0, 0))))
            outItems.push(new Date(new Date(ti.timestamp).setHours(0, 0, 0, 0)))
            outItems.push(ti)
        } else {
            const lastItem = outItems[outItems.length - 1]
            if (!isTimelineItem(lastItem)) throw new Error("Last item should always be a timeline item")
            if (lastItem.timestamp.toDateString() == ti.timestamp.toDateString()) {
                // if same date, push item
                outItems.push(ti)
            } else if (lastItem.timestamp.toDateString() == new Date(ti.timestamp.getTime() - 86400000).toDateString()) {
                // if the day before, push single dayitem and item
                outItems.push(new Date(new Date(ti.timestamp).setHours(0, 0, 0, 0)))
                outItems.push(ti)
            } else {
                // if multi-day gap, push gap, dayitem, and item
                outItems.push(new TimeGap(new Date(new Date(lastItem.timestamp).setHours(0, 0, 0, 0) + 86400000), new Date(new Date(ti.timestamp).setHours(0, 0, 0, 0))))
                outItems.push(new Date(new Date(ti.timestamp).setHours(0, 0, 0, 0)))
                outItems.push(ti)
            }
        }
    })
    outItems.push(new TimeGap(new Date(new Date(timelineItems[timelineItems.length - 1].timestamp).setHours(0, 0, 0, 0) + 86400000), null))

    return outItems
}