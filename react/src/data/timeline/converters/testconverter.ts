import { TimelineItem } from "../timeline";
import { TestNote } from "../../../../jazz/schema/integrations/test-integration";

export class TestTimelineItem implements TimelineItem {
    static SOURCE = "test"
    static TYPE = "note"

    id: string
    timestamp: Date
    source: string
    type: string
    description: string

    constructor(
        testNote: TestNote,
    ) {
        this.id = testNote.id
        this.timestamp = testNote.timestamp
        this.source = TestTimelineItem.SOURCE
        this.type = TestTimelineItem.TYPE
        this.description = testNote.text
    
    }
}

