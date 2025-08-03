import { co, z } from "jazz-tools"
import { Integration } from "../integrations"

export const TestEvent = co.map({
    name: z.string(),
    start: z.date(),
    end: z.date()
});
export const EventList = co.list(TestEvent);
export const TestIntegration = co.map({
    ...Integration.shape,
    events: EventList
});

export function MOCK_TEST_EVENTS() { return [
    TestEvent.create({ name: "2023", start: new Date(2023, 0, 1, 0, 0), end: new Date(2023, 11, 31, 23, 59) }),
    TestEvent.create({ name: "Within 2023", start: new Date(2023, 4, 1, 0, 0), end: new Date(2023, 4, 12, 23, 59) }),
    TestEvent.create({ name: "Is the problem my custom json work?", start: new Date(2024, 8, 13, 8, 12), end: new Date(2024, 11, 13, 8, 12) }),
    TestEvent.create({ name: "Or how I'm constructing CoLists?", start: new Date(2025, 1, 10, 5, 14), end: new Date(2025, 3, 10, 5, 14) }),
] }