// const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const dateFormatterWithYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function DayItem({ date, className }: { date: Date, className?: string }) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-cente gap-2">
                <p className="text-2xl font-medium bg-neutral-100 px-2 rounded-md text-neutral-600">{dayOfWeekFormatter.format(date)}</p>
                <p className="text-2xl font-medium">{
                date.getFullYear() == new Date(Date.now()).getFullYear()
                    ? dateFormatter.format(date)
                    : dateFormatterWithYear.format(date)
                }</p>
            </div>
        </div>
    )
}