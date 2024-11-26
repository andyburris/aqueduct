import { createContext } from "react";
import { AutomaticIngestionMethod, Extension } from "./extension";

export class Orchestrator {
    constructor(
        public extensions: Extension[],
    ) {}

    startSync() {
        const syncs = this.extensions
            .flatMap((e) => e.ingestionMethods)
            .filter(im => im instanceof AutomaticIngestionMethod)
        
        syncs.forEach(im => im.trySync().then(r => im.onSync(r, im.id)))
    }
}

export const OrchestratorContext = createContext(new Orchestrator([]))