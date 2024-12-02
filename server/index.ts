import { createMergeableStore } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import { createWsServer } from 'tinybase/synchronizers/synchronizer-ws-server';
import { WebSocketServer } from 'ws';
import { orchestratorFromStore } from './demoorchestrator';

const PORT = 8050

console.log(`Starting server at ws://localhost:${PORT}`)

const store = createMergeableStore()
const persistingServer = createWsServer(
  new WebSocketServer({port: PORT}),
  (pathId) => [
    createFilePersister(
      store,
      pathId.replace(/[^a-zA-Z0-9]/g, '-') + '.json',
    ),
		(store) => {
			const orchestrator = orchestratorFromStore(store)
			console.log("Syncing...")
			orchestrator.startSync()	
		}]
);