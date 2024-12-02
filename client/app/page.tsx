"use client"

import ReconnectingWebSocket from "reconnecting-websocket";
import { createMergeableStore, MergeableStore } from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { Provider, useCreateMergeableStore, useCreatePersister, useCreateSynchronizer } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { HomePage } from "./home/HomePage";

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

const SERVER_SCHEME = 'ws://';
const SERVER = 'localhost:8050';
export function PageProvider({ children }: { children: React.ReactElement }) {
	const store = useCreateMergeableStore(() => createMergeableStore())
	useCreatePersister(
		store, 
		(store) => createLocalPersister(store, "notesStore"),
		[], 
		async (persister) => {
			await persister.startAutoLoad([{}, {},]);
			await persister.startAutoSave();
		})

	useCreateSynchronizer(store, async (store: MergeableStore) => {
		const synchronizer = await createWsSynchronizer(
			store,
			new ReconnectingWebSocket(SERVER_SCHEME + SERVER + "/demo"),
			1
		);
		await synchronizer.startSync();
	
		// If the websocket reconnects in the future, do another explicit sync.
		synchronizer.getWebSocket().addEventListener('open', () => {
			synchronizer.load().then(() => synchronizer.save());
		});
	
		return synchronizer;
		});
	
	
	return (
		<Provider store={store}>
			{children}
			<Inspector/>
		</Provider>
	);
}