import { TimelineItem } from "@/app/data/timeline/timeline";
import React from "react";

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
        <div className="flex">
            <div className="grow">
                {children}
            </div>
            <p className="text-neutral-500">{timeFormatter.format(item.timestamp)}</p>
        </div>
    )
}