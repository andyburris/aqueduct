import { TimelineDurationItem, TimelineItem } from "../../data/timeline/timeline";
import React from "react";
import { LogoForSource } from "../../common/Logos";

const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
})

export function DefaultTimelineView({ item }: { item: TimelineItem }) {
    return (
        <BasicTimelineView item={item}>
            <p className="grow">{item.description}</p>
        </BasicTimelineView>
    )
}

export function BasicTimelineView({ item, children }: { item: TimelineItem, children: React.ReactElement }) {
    return (
        <div className="flex gap-2 pr-5 py-2" style={{ ["--icon-border" as string]: item instanceof TimelineDurationItem ? item.duration.color : "var(--neutral-200)"}}>
            <LogoForSource 
                source={item.source.toLowerCase()} 
                type={item.type.toLowerCase()}
                className={`w-6 h-6 rounded-2xl text-sm border shrink-0 border-[var(--icon-border)]`}
                 />
            <div className="grow">
                {children}
            </div>
            <p className="text-neutral-500 shrink-0 text-right">{timeFormatter.format(item.timestamp)}</p>
        </div>
    )
}