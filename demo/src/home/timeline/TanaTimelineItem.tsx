import Markdown from "react-markdown";
import { TanaTimelineItem } from "../../data/timeline/converters/tanaconverter";
import { BasicTimelineView } from "./DefaultTimelineView";

export function TanaTimelineView({ item }: { item: TanaTimelineItem }) {
    return(
        <BasicTimelineView item={item}>
            <div className="flex flex-col">
                <p className="grow">{item.description}</p>
                {(() => {
                    const cleanedText = (item.childText || "")
                        .replace("<em>", "*")
                        .replace("</em>", "*")
                        .replace("<strong>", "**")
                        .replace("</strong>", "**")
                        .split('\n')
                        .slice(2)
                        .join('\n')
                        .trim();
                    return cleanedText ? (
                        <article className="prose wrap-anywhere">
                            <Markdown>{cleanedText}</Markdown>
                        </article>
                    ) : null;
                })()}
            </div>
        </BasicTimelineView>
    )
}