import { DurationInfo, isTimelineItem, TimeGap, ViewItemWithDurations } from "../HomePage";
import { DayItem } from "./DayItem";
import { TimeGapView } from "./TimeGapView";
import { TimelineItemSwitcher } from "./TimelineItemSwitcher";

const TopLeftConnector = ({ color }: { color?: string }) => <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ fill: color }}>
<path d="M1 0C3 0 3 2 5 2H6V4H5C3 4 3 6 3 6H0V0H1Z"/>
</svg>

const RightConnector = ({ color }: { color?: string }) => <svg width="6" height="6" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg" style={{ fill: color }}>
    <path d="M3.5 6C3.5 6 2 4 0 4V2C2 2 3.5 0 3.5 0H6V3V6H3.5Z"/>
</svg>


export function DurationsView({ item }: { item: ViewItemWithDurations}) {
    const { durationInfos, item: viewItem } = item

    const itemView = (viewItem instanceof TimeGap)
        ? <TimeGapView gap={viewItem} key={`${viewItem.startDate?.toISOString()}-${viewItem.endDate?.toISOString()}`}/>
        : (isTimelineItem(viewItem)) 
        ? <TimelineItemSwitcher item={viewItem} key={`${viewItem.source}/${viewItem.type}/${viewItem.id}`}/>
        : <DayItem date={viewItem} key={viewItem?.toISOString()}/>

    return (
        <div className="flex">
            <Durations durationInfos={durationInfos} />
            <div className="grow">
                {itemView}
            </div>
        </div>
    )
}

function Durations({ durationInfos }: { durationInfos: (DurationInfo | null)[] }) {
    return (
        <div className="flex gap-0.5 pr-2">
            {durationInfos.map((durationInfo, index) => {
                if (durationInfo === null) return <div key={index} className="w-1" />
                const { duration, firstItemInDuration, finalItemInDuration } = durationInfo
                return (
                    <div className="flex w-1">
                        <div 
                            key={index} 
                            className={`w-1 shrink-0 ${firstItemInDuration ? "rounded-t-sm mt-[17px]" : ""} ${finalItemInDuration ? "rounded-b-sm mb-[50%]" : ""}`}
                            style={{ backgroundColor: duration.color, borderStyle: duration.style }}
                        />
                        { firstItemInDuration && 
                            <div className="flex mt-[17px] -ml-[3px]">
                                <TopLeftConnector color={duration.color} />
                                <div className="h-0.5 mt-0.5" style={{ width: (5 * (durationInfos.length - index - 1)) + 3, backgroundColor: duration.color }}/>
                                <RightConnector color={duration.color} />
                            </div>
                        }
                    </div>
                )
            })}
        </div>
    )
}