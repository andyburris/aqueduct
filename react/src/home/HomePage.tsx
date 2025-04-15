"use client"

import { GearSix } from "@phosphor-icons/react";
import { JazzInspector } from "jazz-inspector";
import { useAccount } from "jazz-react";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { Link } from "../common/Components";
import { FountainLogo } from "../common/FountainLogo";
import { Header } from "../common/Header";
import { SpotifyListenTimelineItem, SpotifyPlaylistTimelineItem } from "../data/timeline/converters/spotifyconverter";
import { TestTimelineItem } from "../data/timeline/converters/testconverter";
import { Duration, TimelineDurationItem, TimelineItem } from "../data/timeline/timeline";
import { OnboardingPage } from "../onboarding/OnboardingPage";
import { TicksWithIndicator } from "./Ticks";
import { DurationsView } from "./timeline/DurationsView";
import { LocationHistoryTimelineItem } from "../data/timeline/converters/locationhistoryconverter";
import { GooglePhotoTimelineItem } from "../data/timeline/converters/googlephotoconverter";

export function HomePage() {
    const { me } = useAccount({ resolve: { root: { syncState: {  } } }})
    if(!me) return <p>Loading...</p>
    if(!me.root.syncState.syncing) return <OnboardingPage/>

    return (
        <div className="flex flex-col min-h-screen max-h-screen min-w-screen max-w-screen items-center">
            <Header className="max-w-4xl w-full absolute top-0 bg-white z-10">
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
            spotifyIntegration: { playlists: { items: true }, listeningHistory: { listens: true } },
            // googleIntegration: { files: true },
            googleIntegration: { files: { items: true }, locations: { items: true }, photos: { items: { $each: { photo: true } } } },
            testIntegration: { events: { $each: true} }
        }
    } }})
    if (!me) return <p className="mt-16">Loading...</p>
    // return <p className="mt-16">Loaded</p>
    const spotifyTimelineItems: SpotifyPlaylistTimelineItem[] = me.root.integrations.spotifyIntegration.playlists.items
        .flatMap(playlist => SpotifyPlaylistTimelineItem.playlistToTimelineItems(playlist))
    const spotifyListenItems = me.root.integrations.spotifyIntegration.listeningHistory.listens
        .map(listen => new SpotifyListenTimelineItem(listen))
    const googleDriveTimelineItems: TimelineItem[] = me.root.integrations.googleIntegration.files.items
        .map(file => new TimelineItem(
            file.id ?? "",
            new Date(file.modifiedTime ?? 0),
            "google-drive",
            "File",
            file.name ?? "",
        ))
    const locationHistoryTimelineItems: TimelineItem[] = me.root.integrations.googleIntegration.locations.items
        .map(l => new LocationHistoryTimelineItem(l))
    const googlePhotosTimelineItems: TimelineItem[] = me.root.integrations.googleIntegration.photos.items
        .map(p => new GooglePhotoTimelineItem(p.photo, p.metadata))
    // const testTimelineItems: TestTimelineItem[] = me.root.integrations.testIntegration.events
    //     .map(n => new TestTimelineItem(n))
    
    const allTimelineItems = [
        ...spotifyTimelineItems,
        ...spotifyListenItems,
        ...googleDriveTimelineItems,
        ...locationHistoryTimelineItems,
        ...googlePhotosTimelineItems,
        // ...testTimelineItems,
    ]
    const sortedTimelineItems = allTimelineItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    const withDays = insertDays(sortedTimelineItems)
    const withDurations = addDurations(withDays)


    return (
        <div className="flex flex-col flex-grow w-full overflow-visible">
            <Virtuoso
                className="flex flex-col h-full flex-grow overflow-visible"
                totalCount={withDurations.length + 1}
                initialTopMostItemIndex={{ align: "end", index: withDurations.length }}
                rangeChanged={({ startIndex, endIndex }) => {
                    setScrollPosition({ startIndex, endIndex })
                }}
                itemContent={(index: number) => {
                    if(index >= withDurations.length) return <div className="h-8" />
                    const item = withDurations[index]
                    return (
                        <div className={`max-w-4xl w-full mx-auto`}>
                            <DurationsView item={item} />
                        </div>
                    )
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent h-8">
                <TicksWithIndicator
                    startDate={sortedTimelineItems[0]?.timestamp ?? new Date()} 
                    endDate={sortedTimelineItems[sortedTimelineItems.length - 1]?.timestamp ?? new Date()}
                    currentRange={{ 
                        startDate: viewItemDate(withDays[scrollPosition.startIndex < withDays.length ? scrollPosition.startIndex : withDays.length - 1]), 
                        endDate: viewItemDate(withDays[scrollPosition.endIndex < withDays.length ? scrollPosition.endIndex : withDays.length - 1]) 
                    }}
                    className="pt-3 w-full h-8"
                />
            </div>
        </div>
    )
}

export class TimeGap { constructor (public startDate: Date | null, public endDate: Date | null) {}}
export type ViewItem = TimelineItem | Date | TimeGap
export type DurationWithSource = Duration & { source: string, type: string }
export interface DurationInfo {
    incoming: DurationWithSource | null,
    outgoing: DurationWithSource | null,
}
export class ViewItemWithDurations {
    constructor(
        public durationInfos: DurationInfo[],
        public item: ViewItem,
    ) {}
}
export function isTimelineItem(item: ViewItem): item is TimelineItem {
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

function addDurations(sortedViewItems: ViewItem[]): ViewItemWithDurations[] {
    const outItems: ViewItemWithDurations[] = []
    let currentDurations: DurationInfo[] = []

    sortedViewItems.forEach((item, index) => { 
        const nextTimestamp = index < sortedViewItems.length - 1 ? viewItemDate(sortedViewItems[index + 1]) : null

        // first, check if any incoming durations end at this item
        const incomingDurations = currentDurations.map(d => d.outgoing)
        const outgoingDurations = incomingDurations.map(d => {
            if (!d) return null
            const isLast = !nextTimestamp || d.end < nextTimestamp
            return isLast ? null : d
        })

        if(item instanceof TimelineDurationItem) {
            const withSource = { ...item.duration, source: item.source, type: item.type }
            const firstNullDurationIndex = outgoingDurations.findIndex(d => d === null)
            if (firstNullDurationIndex !== -1) {
                outgoingDurations[firstNullDurationIndex] = withSource
            } else {
                outgoingDurations.push(withSource)
            }
        }

        const currentDurationsInfos: DurationInfo[] = outgoingDurations.map((d, index) => { 
            const incoming = incomingDurations[index]
            return { 
                incoming: incoming,
                outgoing: d,
            }
         })

        outItems.push(new ViewItemWithDurations(currentDurationsInfos, item))

        currentDurations = currentDurationsInfos
    })

    const maxConcurrentDurationSlots = Math.max(...outItems.map(item => item.durationInfos.length))
    outItems.forEach(item => {
        while (item.durationInfos.length < maxConcurrentDurationSlots) {
            item.durationInfos.push({ incoming: null, outgoing: null })
        }
    })

    return outItems
}