import { Cell, createMergeableStore, createStore, Store } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import { createWsServer } from 'tinybase/synchronizers/synchronizer-ws-server';
import { WebSocketServer } from 'ws';
import { orchestratorFromStore } from './demoorchestrator';
import { Orchestrator } from './skybridge/orchestrator';

const PORT = 8050

console.log(`Starting server at ws://localhost:${PORT}`)

const persistingServer = createWsServer(
  new WebSocketServer({port: PORT}),
  (pathId) => [
    createFilePersister(
      createMergeableStore(),
      pathId.replace(/[^a-zA-Z0-9]/g, '-') + '.json',
    ),
    (store) => {
        loadCellAndListen(store, "test", "test", "test", (c) => console.log("test changed =", c))
    }]
);

function loadCellAndListen(store: Store, tableId: string, rowId: string, cellId: string, listener: (c: Cell | undefined) => void) {
    const cell = store.getCell(tableId, rowId, cellId)
    listener(cell)
    store.addCellListener(tableId, rowId, cellId, (s, ti, ri, ci, newCell) => listener(newCell))
}