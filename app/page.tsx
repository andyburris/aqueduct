"use client"

import { HomePage } from "./home/HomePage";
import { Inspector } from "tinybase/ui-react-inspector";
import { Provider, useCreatePersister, useCreateStore, useStore } from "tinybase/ui-react";
import { createStore, Table } from "tinybase";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import { useEffect, useMemo } from "react";
import { Orchestrator, OrchestratorContext } from "./skybridge/orchestrator";
import { SupernotesAPIIngestion, SupernotesExtension } from "./skybridge/extensions/supernotes";
import { flatten } from "flat"
import { NotionAPIIngestion, NotionExportIngestion, NotionExtension } from "./skybridge/extensions/notion";

const testNote: Note = {
	id: "test",
	title: "Test Note",
	content: "content of the test note",
	source: "test",
	timestamp: Date.now(),
	createdTimestamp: Date.now(),
	syncedTimestamp: Date.now(),
}
const testNote2: Note = {
	id: "test-2",
	content: "this is an untitled test note",
	source: "test",
	timestamp: Date.now(),
	createdTimestamp: Date.now(),
	syncedTimestamp: Date.now(),
}


export default function Home() {
	return (
		<PageProvider>
			<HomePage/>
		</PageProvider>
	)
}

export function PageProvider({ children }: { children: React.ReactElement }) {
	const store = useCreateStore(() => createStore())
	useCreatePersister(
		store, 
		(store) => createIndexedDbPersister(store, "notesStore"),
		[], 
		async (persister) => {
			await persister.startAutoLoad([{}, {},]);
			await persister.startAutoSave();
		})

	const orchestrator = useMemo(() => new Orchestrator([
		new SupernotesExtension(
			new SupernotesAPIIngestion(
				() => {
					return new Promise(resolve => {
						setTimeout(() => {
							const apiKey = store.getCell("extensions", "supernotes", "apiKey")
							resolve(apiKey ? (apiKey as string) : null)
						}, 200)
					})
				},
				(r, extensionId) => {
					console.log("got supernotes response", r) 
					const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
					store.setTable(extensionId, flattened)

					const notes: Table = Object.fromEntries(Object.entries(r).map(([k, v]) => {
						const raw: any = v
						const note: Note = {
							id: k,
							title: raw.data.name,
							content: raw.data.markup,
							source: extensionId,
							timestamp: new Date(raw.data.modified_when).getTime(),
							createdTimestamp: new Date(raw.data.created_wehn).getTime(),
							syncedTimestamp: Date.now(),
						}
						return [k, { ...note }]
					}))
					store.setTable("notes", notes)
				}
			)
		),
		new NotionExtension(
			new NotionAPIIngestion(
				() => {
					return new Promise(resolve => {
						setTimeout(() => {
							const apiKey = store.getCell("extensions", "notion", "apiKey")
							const activeUser = store.getCell("extensions", "notion", "activeUserID")
							resolve({ apiKey: apiKey ? (apiKey as string) : null, activeUserID: activeUser ? (activeUser as string) : null })
						}, 200)
					})
				},
				(r, extensionId) => {
					console.log("got notion response", r) 
					const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
					store.setTable(extensionId, flattened)

					const notes: Table = Object.fromEntries(Object.entries(r).map(([k, v]) => {
						const raw: any = v
						const note: Note = {
							id: k,
							title: raw.data.name,
							content: raw.data.markup,
							source: extensionId,
							timestamp: new Date(raw.data.modified_when).getTime(),
							createdTimestamp: new Date(raw.data.created_wehn).getTime(),
							syncedTimestamp: Date.now(),
						}
						return [k, { ...note }]
					}))
					// store.setTable("notes", notes)
				}
			),
			new NotionExportIngestion(
				(r, extensionId) => {
					console.log("got notion response", r) 
					const flattened = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flatten(v)])) as Table
					store.setTable(extensionId, flattened)

					const notes: Table = Object.fromEntries(Object.entries(r).map(([k, v]) => {
						const raw: any = v
						const note: Note = {
							id: k,
							title: raw.data.name,
							content: raw.data.markup,
							source: extensionId,
							timestamp: new Date(raw.data.modified_when).getTime(),
							createdTimestamp: new Date(raw.data.created_wehn).getTime(),
							syncedTimestamp: Date.now(),
						}
						return [k, { ...note }]
					}))
					// store.setTable("notes", notes)
				}
			)
		),
	]), [])
	useEffect(() => orchestrator.startSync(), [orchestrator])
	
	return (
		<Provider store={store}>
			<OrchestratorContext.Provider value={orchestrator}>
				{children}
				<Inspector/>
			</OrchestratorContext.Provider>
		</Provider>
	);
}