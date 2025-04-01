import { Clock } from "@phosphor-icons/react";
import { TimeGap } from "./HomePage";

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
})

export function TimeGapView({ gap }: { gap: TimeGap }) {
    const startString = gap.startDate ? dateFormatter.format(gap.startDate) : "The start of time"
    const endString = gap.endDate ? dateFormatter.format(gap.endDate) : "The end of time"
    return (
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Clock/>
            <p>{startString} - {endString}</p>
        </div>
    )
}