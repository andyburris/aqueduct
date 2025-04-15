import { ImageDefinition } from "jazz-tools";
import { TimelineItem } from "../timeline";
import { GooglePhotoMetadata } from "aqueduct";

export class GooglePhotoTimelineItem extends TimelineItem {
    static SOURCE = "google-photos";
    static TYPE = "photo";

    constructor(
        public photo: ImageDefinition,
        public metadata: GooglePhotoMetadata,
    ) {
        super(
            metadata.url,
            new Date(metadata.photoTakenTime.formatted),
            GooglePhotoTimelineItem.SOURCE,
            GooglePhotoTimelineItem.TYPE,
            metadata.title,
            metadata.url,
        )
    }
}