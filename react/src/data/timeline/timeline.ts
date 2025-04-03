export class TimelineItem {
    constructor(
        public id: string,
        public timestamp: Date,
        public source: string,
        public type: string,
        public description: string,
    ) {}
}