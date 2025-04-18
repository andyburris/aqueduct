import { AccessToken } from '@spotify/web-api-ts-sdk';
import { SpotifyExtension, Stream, seconds } from 'aqueduct';
import { SpotifyIntegration } from '../../jazz';

export async function syncSpotify(data: SpotifyIntegration) {
    const spotify = new SpotifyExtension({ 
      clientID: process.env.SPOTIFY_CLIENT_ID ?? "",
    });

    const loadedData = await data.ensureLoaded({ resolve: { playlists: { items: true }, listeningHistory: { listens: true, fileInProcess: true } }})

    const token = Stream
      .fromListener<AccessToken | undefined>(emit => loadedData.subscribe({ resolve: { } }, (i) => { emit(i.authentication) }))
      .dropRepeats()
      .onEach(token => console.log("Got token: ", token))

    const playlists = token
      .every(
          seconds(30),
          loadedData.playlists.lastSyncStarted?.getTime(),
          syncedAt => loadedData.playlists.lastSyncStarted = new Date(syncedAt)
      )
      .filter(token => !!token)
      .map(token => {
        const previousPlaylists = loadedData.playlists.items
        console.log(`getting playlists with ${previousPlaylists.length} previous playlists`)
        return spotify.playlists.getAll(token, previousPlaylists)
      }, 1)
      .listen(playlists => loadedData.playlists.items.applyDiff(playlists.allItems));

    const listensRefresh = token
      .every(
          seconds(10),
          loadedData.listeningHistory.lastSyncStarted?.getTime(),
          syncedAt => loadedData.listeningHistory.lastSyncStarted = new Date(syncedAt)
      )
      .filter(token => !!token)

    const currentlyListening = listensRefresh
      .map(async token => {
        const previousListens = await loadedData.listeningHistory.listens
        console.log(`getting currently listening with ${previousListens.length} previous listens`)
        return spotify.listens.getCurrent(token, previousListens)
      }, 1)
      .listen(listens => {
        loadedData.listeningHistory.listens.applyDiff(listens.allItems)
        loadedData.listeningHistory.lastSyncFinished = new Date()
      })
    
    const recentlyListened = listensRefresh
      .map(async token => {
        const previousListens = await loadedData.listeningHistory.listens
        console.log(`getting recently listened with ${previousListens.length} previous listens`)
        return spotify.listens.getRecents(token, previousListens, 5)
      }, 1)
      .listen(listens => {
        loadedData.listeningHistory.listens.applyDiff(listens.allItems)
        loadedData.listeningHistory.lastSyncFinished = new Date()
      })
    
    const exportFile = Stream
      .fromListener<File>(emit => loadedData.listeningHistory.subscribe({ resolve: { } }, (i) => { 
        const blob = i.fileInProcess?.toBlob()
        if(blob) emit(new File([blob], "export.zip"))
      }))
      .dropRepeats()
      .map(file => spotify.listens.unzipExportFile(file))
      // .onEach(rawListens => console.log(`Unzipped export file with ${rawListens.length} listens`))
      .map(rawListens => rawListens.slice(-1000))

    const exportedHistory = Stream.combine(exportFile, token)
      .filter(([_, token]) => !!token)
      .map(([file, token]) => {
        const previousListens = loadedData.listeningHistory.listens
        return spotify.listens.parseExportData(token!, file, previousListens)
      }, 1)
      .listen(listens => {
        console.log(`Parsed export file with ${listens.allItems.length} listens`)
        loadedData.listeningHistory.listens.applyDiff(listens.allItems)
        loadedData.listeningHistory.fileInProcess
      })
}

function isAccessToken(token: any): token is AccessToken {
    return "access_token" in token && "token_type" in token && "expires_in" in token && "refresh_token" in token && "expires" in token;
}