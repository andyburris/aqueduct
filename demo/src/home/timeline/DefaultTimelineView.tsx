import { TimelineDurationItem, TimelineItem } from "../../data/timeline/timeline";
import React from "react";
import { LogoForSource } from "../../common/Logos";
import { Link } from "react-router";

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
    const logo = <LogoForSource 
        source={item.source.toLowerCase()} 
        type={item.type.toLowerCase()}
        className={`w-6 h-6 rounded-2xl text-sm border shrink-0 border-(--icon-border)`}
     />

    return (
        <div className="flex gap-2 pr-5 py-2" style={{ ["--icon-border" as string]: item instanceof TimelineDurationItem ? item.duration.color : "rgb(229, 229, 229)"}}>
            { item.url 
                ? <Link to={item.url} className="shrink-0">{logo}</Link>
                : logo
            }
            <div className="grow shrink">
                {children}
            </div>
            <p className="text-neutral-500 shrink-0 text-right">{timeFormatter.format(item.timestamp)}</p>
        </div>
    )
}