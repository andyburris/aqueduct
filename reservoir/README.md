Reservoir lets you use data from any 3rd-party service like it's local. Choose from 50+ prebuilt integrations, or create your own. 

```tsx
function ReservoirApp() {
    const spotify = useIntegration(
        SpotifyIntegration, 
        { resolve: { playlists: { $each: { tracks: true } } } }
    )

    if(!spotify.$isLoaded) return <p>Loading...</p>
    if(spotify.isLoggedIn) return <button onClick={spotify.logIn()}>Log In</button>
    return <div>
        {spotify.playlists.map(playlist => 
            <p key={p.id}>
                {p.name} • {p.tracks.length} tracks
            </p>
        )}
    </div>
}
```

# Installing
First, install the core of Reservoir:
```sh
npm i @hydraulics/reservoir
```
Then install the integrations you want to use. For example:
```sh
npm i @hydraulics/reservoir-spotify
```

# Getting started

# Computed values
Often, instead of just display 3rd-party data, you want to use it to compute other values. In Reservoir, you do this by setting up a `Stream` 

As a trivial example, imagine you're working with some third-party notes, and you want to calculate a word count for each note.
```ts
const ComputedNote = co.map({
    baseNote: ThirdPartyNote,
    wordCount: z.number(),
}).computedFrom((this) => 
    Stream.fromCoValue(this.baseNote)
        .map(note => {
            const count = note.text.trim().split(/\s+/).filter(w => w.length > 0).length;
            this.wordCount = count;
        })
        .listen()
)
```

Often you'll want the computation to depend on values that aren't essential parts of the computed value. In that case, we recommend creating a property named `$dependencies` that holds the dependency values. 
<!-- Could instead make it an option in computedFrom that goes into $computation.dependencies automatically? -->

# How it works
Reservoir is built on top of a storage framework called Jazz. You can learn more about it [here](https://jazz.tools), but in short it's a database that exposes its data as **reactive JSON**. More specifically, every value is a `readonly object` that includes a `.$jazz` property where you can `.set()` properties or `.subscribe()` to the object. 

It also handles permissions, automatic cross-device sync, and much more. Its most important feature, for Reservoir's purpose, is the ability to specify exactly which data to resolve.

```ts
parent.$jazz.ensureLoaded({ child: { grandchild: true } })
```

Reservoir automatically syncs all of the data that gets resolved, and only the data that gets resolved.