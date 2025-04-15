export class TimelineItem {
    constructor(
        public id: string,
        public timestamp: Date,
        public source: string,
        public type: string,
        public description: string,
        public url?: string,
    ) {}
}

export interface Duration {
    start: Date
    end: Date
    color: string
    style: "solid" | "dashed" | "dotted",
}
export class TimelineDurationItem extends TimelineItem {
    constructor(
        public id: string,
        public duration: Duration,
        public source: string,
        public type: string,
        public description: string,
        timestamp: Date = duration.start,
    ) {
        super(id, timestamp, source, type, description)
    }
}