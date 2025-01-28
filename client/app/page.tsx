"use client"

import ReconnectingWebSocket from "reconnecting-websocket";
import { createMergeableStore, createQueries, MergeableStore } from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { Provider, useCreateMergeableStore, useCreatePersister, useCreateQueries, useCreateSynchronizer } from "tinybase/ui-react";
import { Inspector } from "tinybase/ui-react-inspector";
import { HomePage } from "./home/HomePage";

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
	const sharedStore = useCreateMergeableStore(() => createMergeableStore())
	const secureStore = useCreateMergeableStore(() => createMergeableStore())
	useCreatePersister(
		sharedStore, 
		(store) => createLocalPersister(store, "notesStore"),
		[], 
		async (persister) => {
			await persister.startAutoLoad([{}, {},]);
			await persister.startAutoSave();
		})

	const sharedSync = useCreateSynchronizer(sharedStore, async (store: MergeableStore) => {
		const synchronizer = await createWsSynchronizer(
			store,
			new ReconnectingWebSocket(SERVER_SCHEME + SERVER + "/demo/shared"),
			1
		);
		await synchronizer.startSync();
	
		// If the websocket reconnects in the future, do another explicit sync.
		synchronizer.getWebSocket().addEventListener('open', () => {
			synchronizer.load().then(() => synchronizer.save());
		});
	
		return synchronizer;
	});

	const secureSync = useCreateSynchronizer(secureStore, async (store: MergeableStore) => {
		const synchronizer = await createWsSynchronizer(
			store,
			new ReconnectingWebSocket(SERVER_SCHEME + SERVER + "/demo/secure"),
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
		<Provider 
			store={sharedStore} 
			storesById={{secure: secureStore}} 
			synchronizer={sharedSync} 
			synchronizersById={{secure: secureSync}}
		>
			{children}
			<Inspector/>
		</Provider>
	);
}