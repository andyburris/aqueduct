import { Cell, createMergeableStore, createStore, Store } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import { createWsServer } from 'tinybase/synchronizers/synchronizer-ws-server';
import { WebSocketServer } from 'ws';
import { orchestratorFromStore } from './demoorchestrator';
import { Orchestrator } from './skybridge/orchestrator';
import { driveDemo } from './aqueduct/drive-demo';

const PORT = 8050

console.log(`Starting server at ws://localhost:${PORT}`)

const sharedStores = new Map<string, Store>()
const secureStores = new Map<string, Store>()
const orchestrators = new Map<string, Orchestrator>()

const persistingServer = createWsServer(
  new WebSocketServer({port: PORT}),
  (pathId) => [
    createFilePersister(
      createMergeableStore(),
      pathId.replace(/[^a-zA-Z0-9]/g, '-') + '.json',
    ),
		(store) => {
      const [path, type] = pathId.split('/')
      if(type === "secure") {
        secureStores.set(path, store)
      } else if (type === "shared") {
        sharedStores.set(path, store)
      }
      if(sharedStores.has(path) && secureStores.has(path) && !orchestrators.has(path)) {
        const sharedStore = sharedStores.get(path)!
        const secureStore = secureStores.get(path)! 
        // const orchestrator = orchestratorFromStore(sharedStore, secureStore)
        // orchestrators.set(path, orchestrator)
        // console.log("Syncing...")
        // orchestrator.startSync()
        driveDemo(secureStore, sharedStore)
        console.log("Syncing...")
      }
		}]
);