import { co, CoMap } from "jazz-tools";

export class Integration extends CoMap {
}

export class SyncFlow extends CoMap {
    lastSyncStarted = co.optional.Date;
    lastSyncFinished = co.optional.Date;
}
