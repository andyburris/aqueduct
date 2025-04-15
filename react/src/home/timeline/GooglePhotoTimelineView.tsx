import { ProgressiveImg } from "jazz-react";
import { GooglePhotoTimelineItem } from "../../data/timeline/converters/googlephotoconverter";
import { BasicTimelineView } from "./DefaultTimelineView";

export function GooglePhotoTimelineView({ item }: { item: GooglePhotoTimelineItem }) {
    return (
        <BasicTimelineView item={item}>
            <div className="flex flex-col gap-2">
                <div className="h-64 min-h-64 max-h-64 bg-neutral-100 rounded-lg w-fit">
                    <ProgressiveImg image={item.photo}>
                        {({ src }) => (
                            <img 
                                src={src} 
                                alt={item.metadata.title + " - " + item.metadata.description} 
                                className="h-64 rounded-lg border border-neutral-200 w-fit"
                                // style={{ objectFit: "cover" }}
                            />
                        )}
                    </ProgressiveImg>
                </div>
                <div className="flex flex-col">
                    { item.metadata.description && <p className="text-sm">{item.metadata.description}</p> }
                    <p className="text-neutral-500 text-sm">{item.metadata.title}</p>
                </div>
            </div>
        </BasicTimelineView>
    );
}