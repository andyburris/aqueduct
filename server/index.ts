import { createMergeableStore, createStore, Store } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import { createWsServer } from 'tinybase/synchronizers/synchronizer-ws-server';
import { WebSocketServer } from 'ws';
import { syncDrive } from './aqueduct/drive-demo';
import { syncSpotify } from './aqueduct/spotify-demo';

const PORT = 8050

console.log(`Starting server at ws://localhost:${PORT}`)

const sharedStores = new Map<string, Store>()
const secureStores = new Map<string, Store>()
const serverStores = new Map<string, Store>()

const persistingServer = createWsServer(
  new WebSocketServer({port: PORT}),
  (pathId) => [
    createFilePersister(
      createMergeableStore(),
      pathId.replace(/[^a-zA-Z0-9]/g, '-') + '.json',
    ),
		async (store) => {
      const [path, type] = pathId.split('/')
      if(type === "secure") {
        secureStores.set(path, store)
      } else if (type === "shared") {
        sharedStores.set(path, store)
        const serverStore = createStore()
        const persister = createFilePersister(serverStore, path + '-server.json')
        await persister.startAutoLoad()
        persister.startAutoSave()
        serverStores.set(path, serverStore)
      }
      if(sharedStores.has(path) && secureStores.has(path) && serverStores.has(path)) {
        const sharedStore = sharedStores.get(path)!
        const secureStore = secureStores.get(path)! 
        const serverStore = serverStores.get(path)!
        syncDrive(secureStore, sharedStore, serverStore)
        syncSpotify(secureStore, sharedStore, serverStore)
        console.log("Syncing...")
        // testDemo()
      }
		}]
);