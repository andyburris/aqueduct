import { co, CoMap } from "jazz-tools";

export class Integration extends CoMap {
    lastSyncedAt = co.optional.Date;
    lastTriedSyncedAt = co.optional.Date;
}