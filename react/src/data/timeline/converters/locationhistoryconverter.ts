import { TimelineDurationItem } from "../timeline";
import { GoogleLocationHistoryItem } from "aqueduct";

export class LocationHistoryTimelineItem extends TimelineDurationItem {
    static SOURCE = "google-maps"
    static TYPE = "location-history"
    static COLOR = "#CEE7FE"
    
    constructor(
        public item: GoogleLocationHistoryItem,
    ) {
        const isActivity = "activity" in item
        super(
            item.startTimestamp + item.endTimestamp,
            {
                start: new Date(item.startTimestamp),
                end: new Date(item.endTimestamp),
                color: LocationHistoryTimelineItem.COLOR,
                style: isActivity ? "dotted" : "solid",       
            },
            LocationHistoryTimelineItem.SOURCE,
            LocationHistoryTimelineItem.TYPE,
            isActivity 
                ? `${activityTypeToString(item.activity.topCandidate.type)} for ${item.activity.distanceMeters}m` 
                : `Arrived at ${item.visit.topCandidate.placeInfo.name ?? item.visit.topCandidate.placeInfo.address}`,
        )
    }
}

function activityTypeToString(type: string) {
    return type
}

