function YearTicks({ year, className }: { year: number, className?: string }) {
    return (
        <div className={`flex gap-1 items-end justify-between grow ${className ? className : ""}`}>
            <div className="flex w-px gap-0.5">
                <div className="h-5 w-px min-w-px bg-neutral-300" />
                <p className="text-xs text-neutral-400 -mt-0.5">{year}</p>
            </div>
            { Array.from({ length: 11 }, (_, i) => <div key={i} className="h-1.5 w-px bg-neutral-300" />) }
            <div></div>
        </div>
    )
}

export function TicksWithIndicator({ startDate, endDate, currentRange, className }: { startDate: Date, endDate: Date, currentRange: { startDate: Date, endDate: Date }, className?: string }) {
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()

    const yearRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
    const ticks = yearRange.map(year => <YearTicks key={year} year={year} />)

    const rangeStartDate = new Date(startYear, 0)
    const rangeEndDate = new Date(endYear + 1, 0)

    const currentRangeStartPercentage = (currentRange.startDate.getTime() - rangeStartDate.getTime()) / (rangeEndDate.getTime() - rangeStartDate.getTime())
    const currentRangeEndPercentage = (currentRange.endDate.getTime() - rangeStartDate.getTime()) / (rangeEndDate.getTime() - rangeStartDate.getTime())
    const currentRangePercentageWidth = currentRangeEndPercentage - currentRangeStartPercentage
    return (
        <div className={`flex ${className ? className : ""}`}>
            { ticks }
            <div 
                className="absolute h-5 rounded-t-md min-w-1 transition-all duration-50" 
                style={{ 
                    left: `${currentRangeStartPercentage * 100}%`, 
                    width: `${(currentRangePercentageWidth) * 100}%`,
                    backgroundColor: `rgba(0, 0, 0, ${interpolateBetween([0.001, 0.5], [1.0, 0.12], currentRangePercentageWidth)})`,
                }}
                />
            {/* <p>{currentRange.startDate.toDateString()} - {currentRange.endDate.toDateString()}</p> */}
        </div>
    )
}

function interpolateBetween(inputRange: [number, number], outputRange: [number, number], inputValue: number) {
    const clampedInputValue = Math.max(inputRange[0], Math.min(inputValue, inputRange[1]))

    const [inputMin, inputMax] = inputRange
    const [outputMin, outputMax] = outputRange

    const inputRangeSize = inputMax - inputMin
    const outputRangeSize = outputMax - outputMin

    const normalizedValue = (clampedInputValue - inputMin) / inputRangeSize
    return outputMin + normalizedValue * outputRangeSize
}