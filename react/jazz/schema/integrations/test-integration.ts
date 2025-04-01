import { co, CoList, CoMap } from "jazz-tools"
import { Integration } from "../integrations"

export class TestNote extends CoMap {
    text = co.string
    timestamp = co.Date
}
export interface TestNoteJson {
    text: string
    timestamp: number
}
export class NoteList extends CoList.Of(co.ref(TestNote)) {}
export class TestIntegration extends Integration {
    notes = co.ref(NoteList)
}

export function MOCK_TEST_NOTES(): TestNote[] { return [
    TestNote.create({ text: "Is the problem my custom json work?", timestamp: new Date(2024, 10, 13, 8, 12) }),
    TestNote.create({ text: "Or how I'm constructing CoLists?", timestamp: new Date(2025, 3, 10, 5, 14) }),
] }

export function MOCK_TEST_NOTES_JSON(): TestNoteJson[] { return [
    { text: "Is the problem my custom json work?", timestamp: new Date(2024, 10, 13, 8, 12).getTime() },
    { text: "Or how I'm constructing CoLists?", timestamp: new Date(2025, 3, 10, 5, 14).getTime() },
] }

export function MOCK_TEST_NOTES_STRING(): string[] { return [
    "Is the problem my custom json work?",
    "Or how I'm constructing CoLists?",
] }