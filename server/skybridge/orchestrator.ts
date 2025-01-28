import { IngestionMethod, PrereqInfo, SyncInfo } from "./extension";

export interface IngestionMethodWithTrigger<IM extends IngestionMethod<PI, SI>, PI extends PrereqInfo, SI extends SyncInfo> {
    ingestionMethod: IM,
    setupTriggers: Array<(im: IM) => void>,
}

export class Orchestrator {
    constructor(
        public ingestions: IngestionMethodWithTrigger<any, any, any>[],
    ) {}

    startSync() {
        this.ingestions.forEach(imt => {
            imt.setupTriggers.forEach(setupTrigger => setupTrigger(imt.ingestionMethod))
        })
    }
}
