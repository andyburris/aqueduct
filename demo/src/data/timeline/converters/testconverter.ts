import { TimelineDurationItem, TimelineItem } from "../timeline";
import { TestEvent } from "../../../../jazz/schema/integrations/test-integration";

export class TestTimelineItem extends TimelineDurationItem {
    static SOURCE = "test"
    static TYPE = "test-event"

    constructor(
        testEvent: TestEvent,
    ) {
        super(
            testEvent.id,
            {
                start: testEvent.start,
                end: testEvent.end,
                color: "#E5E5E5",
                style: "solid",
            },
            TestTimelineItem.SOURCE,
            TestTimelineItem.TYPE,
            testEvent.name,
        )
    }
}

