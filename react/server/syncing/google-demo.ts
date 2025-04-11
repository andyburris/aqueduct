import { GoogleTakeoutExtension, NewGoogleLocationHistoryItem, Stream } from "aqueduct";
import { GoogleIntegration } from "../../jazz/schema/integrations/google-integration";

export async function syncLocations(data: GoogleIntegration) {
    console.log("Syncing Google Location History...")

    if(!process.env.GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY not set")
    const takeout = new GoogleTakeoutExtension()

    const loadedData = await data.ensureLoaded({ resolve: { authentication: {}, locations: { items: true, } }})
    const file = Stream
        .fromListener<NewGoogleLocationHistoryItem[]>(emit => loadedData.locations.subscribe({}, (loc) => { if(loc.fileInProcess) emit(loc.fileInProcess) }))
        .dropRepeats()

    file
        .map(file => file.filter(i => "visit" in i || "activity" in i).slice(-1000))
        .map(file => {
            console.log(`Parsing file with ${file.length} entries`)
            const previousLocations = loadedData.locations.items
            return takeout.parseCurrentLocationHistory(file, previousLocations)
        }, 1)
        .listen(locations => {
            loadedData.locations.items.applyDiff(locations)
            loadedData.locations.fileInProcess = undefined
        })
}