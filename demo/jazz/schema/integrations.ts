import { co, z } from "jazz-tools";

export const Integration = co.map({})

export const SyncFlow = co.map({
    lastSyncStarted: z.date().optional(),
    lastSyncFinished: z.date().optional()
})
