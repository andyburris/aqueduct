import { TimelineItem } from "../../data/timeline/timeline";
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
        <div className="flex gap-3">
            <LogoForSource source={item.source.toLowerCase()} className="w-6 h-6 rounded-2xl text-sm" />
            <div className="grow">
                {children}
            </div>
            <p className="text-neutral-500">{timeFormatter.format(item.timestamp)}</p>
        </div>
    )
}