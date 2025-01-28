import { Store } from "tinybase"
import { chain } from "./skybridge/chain"

function orchestrateFromStores(sharedStore: Store, secureStore: Store) {
    const extensions = {
        spotify: new SpotifyExtension(),
        google: new GoogleExtension(),
        googledrive: new GoogleDriveExtension(),
        googletakeout: new GoogleTakeoutExtension(),
    }

    const codeForToken = chain(emit => secureStore.listen("spotifyCode", emit))
        .map(code => extensions.spotify.exchangeCodeForToken(code)) 
        .onEach(token => secureStore.set("spotifyToken", token))

    const storedToken = chain(emit => secureStore.listen("spotifyToken", emit))
    const spotifyAuth = zip(storedToken, codeForToken)
        .map(([stored, code]) => stored || code)
        .onEach(token => secureStore.setCell("extensions", "spotify", "loggedIn", true))
        .onError(err => secureStore.setCell("extensions", "spotify", "loggedIn", true))

    const playlists = spotifyAuth
        .every(300, sharedStore.get("spotify.lastSynced"), (syncedAt) => sharedStore.set("spotify.lastSynced", syncedAt))
        .map(token => {
            // const previousPlaylists = sharedStore.get("spotifyPlaylists")
            const previousPlaylists = db.playlists.getAll()
            return extensions.spotify.getPlaylists(token, previousPlaylists, { includeTracks: true })
        })
        // .onEach(updated => sharedStore.set("spotifyPlaylists", updated.result))
        .onEach(updated => updated.changes
            .filterPath("data.playlists.*.")
            .onAdditions(addition => db.playlists.insert(addition.data.id, addition.data))
            .onDeletions(deletion => db.playlists.delete(deletion.data.id))
            .onUpdates(update => db.playlists.update(update.data.id, update.data))
        )

    const googleAuth = extensions.google
        .authFlow({
            code: chain(emit => secureStore.listen("googleCode", emit)),
            loadToken: chain(emit => secureStore.listen("googleToken", emit)),
            saveToken: token => secureStore.set("googleToken", token),
        })

    const takeoutFiles = extensions.googledrive
        .fileFlow({ token: googleAuth, options: { folder: "My Drive/Takeout", extensions: ["zip"] }})
        .map(files => extensions.googletakeout.processFiles(files))

    return [spotifyAuth, playlists, googleAuth, takeoutFiles]
    
}

////////////////////////

const extensions = {
    spotify: new SpotifyExtension(),
    google: new GoogleExtension(),
    googledrive: new GoogleDriveExtension(),
    googletakeout: new GoogleTakeoutExtension(),
}
const setupTriggers = (extensions) => {
    const codeForToken = chain(emit => secureStore.listen("spotifyCode", emit))
        .map(code => extensions.spotify.exchangeCodeForToken(code)) 
        .onEach(token => secureStore.set("spotifyToken", token))

    const storedToken = chain(emit => secureStore.listen("spotifyToken", emit))
    const spotifyAuth = zip(storedToken, codeForToken)
        .map(([stored, code]) => stored || code)
        .onEach(token => secureStore.set("spotifyLoggedIn", true))
        .onError(err => secureStore.set("spotifyLoggedIn", false))

    const playlists = spotifyAuth
        .every(300, sharedStore.get("spotify.lastSynced"), (syncedAt) => sharedStore.set("spotify.lastSynced", syncedAt))
        .map(token => {
            // const previousPlaylists = sharedStore.get("spotifyPlaylists")
            const previousPlaylists = db.playlists.getAll()
            return extensions.spotify.getPlaylists(token, previousPlaylists, { includeTracks: true })
        })
        // .onEach(updated => sharedStore.set("spotifyPlaylists", updated.result))
        .onEach(updated => updated.changes
            .filterPath("data.playlists.*.")
            .onAdditions(addition => db.playlists.insert(addition.data.id, addition.data))
            .onDeletions(deletion => db.playlists.delete(deletion.data.id))
            .onUpdates(update => db.playlists.update(update.data.id, update.data))
        )

    const googleAuth = extensions.google
        .authFlow({
            code: chain(emit => secureStore.listen("googleCode", emit)),
            loadToken: chain(emit => secureStore.listen("googleToken", emit)),
            saveToken: token => secureStore.set("googleToken", token),
        })

    const takeoutFiles = extensions.googledrive
        .fileFlow({ token: googleAuth, options: { folder: "My Drive/Takeout", extensions: ["zip"] }})
        .map(files => extensions.googletakeout.processFiles(files))

    return [spotifyAuth, playlists, googleAuth, takeoutFiles]
}


////////////////////////
// In extensions
function Skybridge.diff(original, updated): Change[] {}
type PipelineResult<T> = { changes: Change[], result: T }
type Pipeline<Input, Options, Output> = (input: Input, options: Options, previous?: Output) => PipelineResult<Output>