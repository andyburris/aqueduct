### Using Aqueduct extensions
First, add the extension for the apps you want to integrate with. If there isn't a publicly available extension for an app, it's easy to [make your own](). 
```typescript
val storage = {} //in-memory storage for demo purposes
val spotify = new SpotifyExtension()
```

Most syncing starts with the user authenticating themselves, so we'll start our stream there. Extensions should have a guide for obtaining a code or token on the frontend, which will be the first value in our stream. We can pass it in using an external handle, or from another reactive source. 
```typescript
const [spotifyCode, spotifyCodeHandle]: [Stream<string>, (code: string) => void] = Stream.handle<string>()
// elsewhere in the app, call the handle to kick off the stream
// spotifyCodeHandle("<SPOTIFY-CODE>")

// even easier with reactive storage frameworks
const spotifyCode = Stream.listener(emit => storage.listen("spotifyCode", emit))
``` 
Next, we use the extension to go through any exchange steps in the authentication process, which you can easily inject with your own storage, logging, etc.
```typescript
const spotifyCodeExchange: Stream<string> = spotifyCode
    .map(code => spotify.auth.exchangeCodeForToken(code))
    .onEach(token => storage["spotifyToken"] = token)
const storedToken = Stream
    .single(storage["spotifyToken"]) // can also be adapted with reactive storage
const spotifyAuthToken = Stream
    .or(spotifyCodeExchange, storedToken) 
    .onEach(token => storage["spotifyLoggedIn"] = token !== undefined)
```
Many extensions will offer more concise, less customizable versions of these steps as flows
```typescript
const spotifyAuthToken = spotify.authFlow({
    code: spotifyCode,
    loadToken: Stream.single(storage["spotifyToken"]),
    saveToken: (token) => {
        storage["spotifyToken"] = token
        storage["spotifyLoggedIn"] = token !== undefined
    },
})
```

With auth handled, we continue the stream by requesting the data we want. Each step won't run until the past one works, so we don't have to worry about requesting data before being signed in, for example. You can easily refresh with the `every` helper. Extensions will usually offer API options (file search, location for weather, etc.).
```typescript
const playlists = spotifyAuthToken
    .every(seconds(30), storage["spotifySyncedAt"], syncedAt => storage["spotifySyncedAt"] = syncedAt)
    .map(token => spotify.playlists.getAll(token, { userOnly: true }))
```

In a basic scenario, we can just save the entire response to storage.
```typescript
playlists
    .onEach(response => storage["spotifyPlaylists"] = response.data)
```
But in most scenarios, we'd rather not refresh a user's entire data each time, incurring unnecessary network requests or database writes. In these cases, Aqueduct allows us to pass in our current data, and produces a list of changes that we can use.
```typescript
const database = ... // generic database
const incrementalPlaylists = spotifyAuthToken
    .every(seconds(30), storage["spotifySyncedAt"], syncedAt => storage["spotifySyncedAt"] = syncedAt)
    .map(token => spotify.playlists.getAll(token, { userOnly: true }))

incrementalPlaylists
    .onEach(response => 
        response.changes
        .forEach(change => {
            if(change.type === "add") database.insert(change.data.id, change.data)
            if(change.type === "delete") database.remove(change.data.id)
            if(change.type === "update") database.update(change.data.id, change.data)
        }
    ))
```
This is especially useful for combining data from multiple API calls, e.g. the Spotify [recent plays]() endpoint and the more complex Spotify [data export]() process.