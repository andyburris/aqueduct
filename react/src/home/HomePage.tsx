"use client"

import { GearSix } from "@phosphor-icons/react";
import { useAccount } from "jazz-react";
import { Container } from "..//common/Container";
import { Link } from "../common/Components";
import { FountainLogo } from "../common/FountainLogo";
import { Header } from "../common/Header";
import { SpotifyPlaylistTimelineItem } from "../data/timeline/converters/spotifyconverter";
import { TestTimelineItem } from "../data/timeline/converters/testconverter";
import { TimelineItem } from "../data/timeline/timeline";
import { OnboardingPage } from "../onboarding/OnboardingPage";
import { DayItem } from "./DayItem";
import { TimeGapView } from "./TimeGapView";
import { TimelineItemSwitcher } from "./timeline/TimelineItemSwitcher";
import { TestNote } from "../../jazz/schema/integrations/test-integration";

export function HomePage() {
    const { me } = useAccount({ resolve: { root: { syncState: {  } } }})
    if(!me) return <p>Loading...</p>
    if(!me.root.syncState.syncing) return <OnboardingPage/>

    return (
        <Container>
            <Header>
                <FountainLogo className="grow"/>
                <Link kind="secondary" to="/integrations">
                    <GearSix/>
                </Link>
            </Header>
            <Timeline/>
        </Container>
    )
}

function Timeline() {
    // const { me } = useAccount({ resolve: { root: {} }})
    const { me } = useAccount({ resolve: { root: {
        integrations: {
            spotifyIntegration: { playlists: true },
            testIntegration: { notes: { $each: true} }
        }
    } }})
    if (!me) return <p>Loading...</p>
    // const spotifyTimelineItems: SpotifyPlaylistTimelineItem[] = me.root.integrations?.spotifyIntegration?.playlists
    //     ?.flatMap(playlist => SpotifyPlaylistTimelineItem.playlistToTimelineItems(playlist))
    //     ?? []
    const spotifyTimelineItems: SpotifyPlaylistTimelineItem[] = me.root.integrations.spotifyIntegration.playlists
        .flatMap(playlist => SpotifyPlaylistTimelineItem.playlistToTimelineItems(playlist))
    const testTimelineItems: TestTimelineItem[] = me.root.integrations.testIntegration.notes
        .flatMap(n => new TestTimelineItem(n))
    
    const allTimelineItems = [
        ...spotifyTimelineItems,
        ...testTimelineItems,
    ]
    const withDays = sortAndInsertDays(allTimelineItems)

    return (
        <div className="flex flex-col gap-6 px-5 py-2 overflow-y-auto">
            {/* <p className="text-neutral-500">{allTimelineItems.length} items</p> */}
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
function sortAndInsertDays(timelineItems: TimelineItem[]): ViewItem[] {
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
    if(timelineItems.length > 0) {
        outItems.push(new TimeGap(new Date(new Date(timelineItems[timelineItems.length - 1].timestamp).setHours(0, 0, 0, 0) + 86400000), null))
    } else {
        outItems.push(new TimeGap(null, null))
    }

    return outItems
}