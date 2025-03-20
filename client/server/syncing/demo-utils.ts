import { Cell, Row, Store } from "tinybase"

export function loadCellAndListen(store: Store, tableId: string, rowId: string, cellId: string, listener: (c: Cell | undefined) => void, mutator: boolean = true) {
    const cell = store.getCell(tableId, rowId, cellId)
    listener(cell)
    store.addCellListener(tableId, rowId, cellId, (s, ti, ri, ci, newCell) => listener(newCell), mutator)
}

export function loadRowAndListen(store: Store, tableId: string, rowId: string, listener: (c: Row | undefined) => void, mutator: boolean = true) {
    const cell = store.getRow(tableId, rowId)
    listener(cell)
    store.addRowListener(tableId, rowId, (s, ti, ri, newRow) => listener(s.getRow(ti, ri)), mutator)
}