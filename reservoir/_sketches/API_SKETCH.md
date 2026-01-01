# Reservoir API Demo

### Spotify Playlists
```tsx
function App() {
    return (
        <ReservoirProvider
            sync={{
                url: "ws://127.0.0.1:4200"
            }}
            integrations={{
                spotify: new SpotifyIntegration({
                    // essentially need Aqueduct flows but with saving built in
                    // should be able to default to no config object? but maybe need it 
                    // e.g. a sync flow where the client inputs an API key doesn't need config, but if we are hard-coding a client ID it probably does to operate w/o server
                    // key is how do we emit events (both edits and things like adding a login, which may or may not be identical to an existing account)
                })
            }}
        >

        </ReservoirProvider>
    )
}

function PlaylistPage() {
    const playlists = useSpotify().accounts.flatMap(a => a.playlists)
    return (
        <div></div>
    )
}

function SettingsPage() {
    const spotify = useSpotify()
    function onPress() { 
        SpotifyIntegration.createLoginURL({
            redirect: "https://localhost:8000/spotify/auth",
            clientID: 
        })
    }
    const flows = spotify.singleAccount()
    return (
        <div>
            /* include unstyled component? that can nest children that take specific actions in the sync flow step e.g. log out? similar to aria filetrigger?*/
            <SyncFlowItem step={flows.client.loginCredentials}>
                { flows.client.loginCredentials
                    ? <p>Logged in as {flows.client.loginCredentials.user.name}</p>
                    : <Button
                        onPress={function() { router.open(SpotifyIntegration.ClientFlow.createLoginURL({ redirect: "https://localhost:8000/spotify/auth" }))}}
                    >
                        Log in to Spotify
                    </Button>
                }
            </SyncFlowItem>
            <SyncFlowItem step={flows.server.syncedPlaylists}>
            <SyncFlowItem step={flows.export}>
            ...
        </div>
    )
}

export function useSpotify(
    resolve: Resolve<SpotifyIntegration> = { playlists: { $each: ... }, ... }
) {
    return useReservoirIntegrations(
        IntegrationBase, // TODO: hoist schema out of ReservoirProvider
        { spotify: resolve }
    ).spotify
    //.singleAccount()
}
```

### Transit API
```tsx
const UserSchema = co.map {
    trmnlLocation: Location,
    originStop: TransitIntegration.Stop,
    destinationStop: TransitIntegration.Stop,
    destinationTime: co.date,
    latePenalty: z.number,
}

function App() {
    const { user, integrations } = useReservoir({
        integrations: {
            transit: new TransitIntegration(), // no per-user state
            maps: new MapsIntegration().optional(), // has per-user state
        },
        user: UserSchema,
    })

    const now = useNow()

    // anything that's a function is dynamic (not stored in the reservoir) e.g. transit.routes()
    // anything that's a value is stored in reservoir e.g. maps.home (and there's a function in the integration setup that handles the sync of that)
    const allRoutes = integrations.transit.routes({
        origin: user.originStop ?? integrations.maps?.home,
        destination: user.destinationStop,
        arriveBy: {
            time: useNow().withTime(user.destinationTime),
            buffer: [-15, 15]
        }
    })
    const sorted = allRoutes.sort((a, b) => {
        const aDiff = user.destinationTime - a.destinationTime
        const bDiff = user.destinationTime - b.destinationTime
        const aPenalized = (aDiff < 0) ? aDiff * user.penalty : aDiff
        const bPenalized = (bDiff < 0) ? bDiff * user.penalty : bDiff
        return aPenalized - bPenalized
    })
    const bestRoute = sorted[0]

    return (
        <div>
            <p>Train leaves in {(bestRoute.departureTime - useNow()).minutes} minutes</p>
        </div>
    )
}
```

### Notes
```tsx
// should this be contained in a FountainIntegration that handles any computation of its own?
// e.g. notes layer computation?
// layer computations need to be reactive to underlying data (but not transformative?), but also need to store data of their own (e.g. embeddings)
const fountainSchema = co.map({
    prefs: co.map({ theme: z.enum(["light", "dark", "system"]) }),
    notes: FountainBaseNotes[],
})

const FountainNode = co.map({
    baseNode: { text: string, source: Note } 
})

const reservoir = createReservoir({
    integrations: {
        notion: new NotionIntegration(),
        drafts: new DraftsIntegration(),
        tana: new TanaIntegration(),
    }
})

function useNotes() {
    const { schema, integrations } = useReservoir(ReservoirSchema, { ... })
    const convertedIntegrations = Object.values(integrations).map((integration) => integrationToNotes(integration))
    return [...schema.notes, convertedIntegrations.flat()]
}
```