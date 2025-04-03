"use client"

import { GearSix } from "@phosphor-icons/react";
import { JazzInspector } from "jazz-inspector";
import { useAccount } from "jazz-react";
import { Virtuoso } from "react-virtuoso";
import { Container } from "..//common/Container";
import { Link } from "../common/Components";
import { FountainLogo } from "../common/FountainLogo";
import { Header } from "../common/Header";
import { SpotifyPlaylistTimelineItem } from "../data/timeline/converters/spotifyconverter";
import { TestTimelineItem } from "../data/timeline/converters/testconverter";
import { TimelineItem } from "../data/timeline/timeline";
import { OnboardingPage } from "../onboarding/OnboardingPage";
import { DayItem } from "./timeline/DayItem";
import { TimeGapView } from "./timeline/TimeGapView";
import { TimelineItemSwitcher } from "./timeline/TimelineItemSwitcher";
import { useState } from "react";
import { TicksWithIndicator } from "./Ticks";

export function HomePage() {
    const { me } = useAccount({ resolve: { root: { syncState: {  } } }})
    if(!me) return <p>Loading...</p>
    if(!me.root.syncState.syncing) return <OnboardingPage/>

    return (
        <div className="flex flex-col min-h-screen max-h-screen min-w-screen max-w-screen items-center">
            <Header className="max-w-4xl w-full">
                <FountainLogo className="grow"/>
                <JazzInspector position="bottom right"/>
                <Link kind="secondary" to="/integrations">
                    <GearSix/>
                </Link>
            </Header>
            <Timeline/>
        </div>
    )
}

function Timeline() {
    const [scrollPosition, setScrollPosition] = useState({ startIndex: 0, endIndex: 0 })
    const { me } = useAccount({ resolve: { root: {
        integrations: {
            spotifyIntegration: { playlists: true },
            googleIntegration: { files: true },
            testIntegration: { notes: { $each: true} }
        }
    } }})
    if (!me) return <p>Loading...</p>
    const spotifyTimelineItems: SpotifyPlaylistTimelineItem[] = me.root.integrations.spotifyIntegration.playlists
        .flatMap(playlist => SpotifyPlaylistTimelineItem.playlistToTimelineItems(playlist))
    const googleDriveTimelineItems: TimelineItem[] = me.root.integrations.googleIntegration.files
        ?.map(file => new TimelineItem(
            file.id ?? "",
            new Date(file.modifiedTime ?? 0),
            "google-drive",
            "File",
            file.name ?? "",
        ))
    const testTimelineItems: TestTimelineItem[] = me.root.integrations.testIntegration.notes
        .map(n => new TestTimelineItem(n))
    
    const allTimelineItems = [
        ...spotifyTimelineItems,
        ...googleDriveTimelineItems,
        ...testTimelineItems,
    ]
    const sortedTimelineItems = allTimelineItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    const withDays = insertDays(sortedTimelineItems)


    return (
        <div className="flex flex-col flex-grow w-full">
            <Virtuoso
                className="flex flex-col h-full flex-grow"
                totalCount={withDays.length}
                initialTopMostItemIndex={{ align: "end", index: withDays.length - 1 }}
                rangeChanged={({ startIndex, endIndex }) => {
                    setScrollPosition({ startIndex, endIndex })
                }}
                itemContent={(index: number) => {
                    const item = withDays[index]
                    const itemView = (item instanceof TimeGap)
                        ? <TimeGapView gap={item} key={`${item.startDate?.toISOString()}-${item.endDate?.toISOString()}`}/>
                        : (isTimelineItem(item)) 
                        ? <TimelineItemSwitcher item={item} key={`${item.source}/${item.type}/${item.id}`}/>
                        : <DayItem date={item} key={item.toISOString()}/>
                    return (
                        <div className="max-w-4xl w-full mx-auto">
                            {itemView}
                        </div>
                    )
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent h-8">
                <TicksWithIndicator
                    startDate={sortedTimelineItems[0]?.timestamp ?? new Date()} 
                    endDate={sortedTimelineItems[sortedTimelineItems.length - 1]?.timestamp ?? new Date()}
                    currentRange={{ startDate: viewItemDate(withDays[scrollPosition.startIndex]), endDate: viewItemDate(withDays[scrollPosition.endIndex]) }}
                    className="pt-3 w-full h-8"
                />
            </div>
        </div>
    )
}

export class TimeGap { constructor (public startDate: Date | null, public endDate: Date | null) {}}
export type ViewItem = TimelineItem | Date | TimeGap
function isTimelineItem(item: ViewItem): item is TimelineItem {
    return "id" in item
}
function viewItemDate(item: ViewItem): Date {
    if (item instanceof Date) return item
    if (item instanceof TimeGap) return item.startDate ?? item.endDate ?? new Date()
    if (isTimelineItem(item)) return item.timestamp
    throw new Error("Item is not a date or timeline item")
}
function insertDays(sortedTimelineItems: TimelineItem[]): ViewItem[] {
    const outItems: ViewItem[] = []
    sortedTimelineItems.forEach(ti => {
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
    if(sortedTimelineItems.length > 0) {
        outItems.push(new TimeGap(new Date(new Date(sortedTimelineItems[sortedTimelineItems.length - 1].timestamp).setHours(0, 0, 0, 0) + 86400000), null))
    } else {
        outItems.push(new TimeGap(null, null))
    }

    return outItems
}