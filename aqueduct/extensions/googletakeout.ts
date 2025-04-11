import { places_v1 } from "googleapis"
import { unzip, ZipEntry } from 'unzipit';

export interface LatLong { latitude: number, longitude: number }
function stringToLatLong(s: string): LatLong { 
    const [lat, long] = s.replace("geo:", "").split(",").map(s => parseFloat(s))
    return { latitude: lat, longitude: long }
}
function latLongToString(ll: LatLong): string { return `geo:${ll.latitude},${ll.longitude}`}

export type GoogleLocationHistoryItem = GoogleLocationHistoryVisit | GoogleLocationHistoryActivity
export interface GoogleLocationHistoryVisit {
    startTimestamp: string,
    endTimestamp: string,
    visit: {
        hierarchyLevel: number,
        topCandidate: {
            probability: number,
            semanticType: string,
            placeID: string,
            placeInfo: {
                name?: string,
                address: string,
            },
            placeLocation: LatLong,
        },
        probability: number,
    },
}
export interface GoogleLocationHistoryActivity {
    startTimestamp: string,
    endTimestamp: string,
    activity: {
        start: LatLong,
        end: LatLong,
        distanceMeters: number,
        topCandidate: {
            probability: number,
            type: string,
        },
    },
}

export class GoogleTakeoutExtension {
    private placesClient: places_v1.Places
    
    constructor() {
        this.placesClient = new places_v1.Places({ auth: process.env.GOOGLE_MAPS_API_KEY! })
    }

    public async unzipFiles(files: File[]) {
        const zips = await Promise.all(files.map(async f => await unzip(await f.arrayBuffer())))
        const allEntries = zips.reduce((acc, zi) => { return {...acc, ...zi.entries } }, {})
    }

    async extractLegacyLocationHistory(entries: { [key: string]: ZipEntry }) {
        const records = await entries["Takeout/Location History (Timeline)/Records.json"].json()

    }

    async parseCurrentLocationHistory(json: NewGoogleLocationHistoryItem[], previousLocationHistory: GoogleLocationHistoryItem[]): Promise<GoogleLocationHistoryItem[]> {
        const placeInfoCache: Map<string, { name?: string, address: string }> = new Map()
        previousLocationHistory.forEach(item => {
            if ("visit" in item) {
                placeInfoCache.set(item.visit.topCandidate.placeID, {
                    name: item.visit.topCandidate.placeInfo.name,
                    address: item.visit.topCandidate.placeInfo.address,
                })
            }
        })
        const promises: Promise<GoogleLocationHistoryItem | null>[] = json.map(async rawItem => {
            // console.log(`Parsing item: ${JSON.stringify(rawItem)}`)
            if (isRawNewVisit(rawItem)) {
                console.log(`Getting place info for ${rawItem.visit.topCandidate.placeID}`)
                const placeInfo = placeInfoCache.has(rawItem.visit.topCandidate.placeID)
                    ? placeInfoCache.get(rawItem.visit.topCandidate.placeID)!
                    : await this.placesClient.places
                        .get({ 
                            name: `places/${rawItem.visit.topCandidate.placeID}`,
                            fields: "shortFormattedAddress,displayName",
                        })
                        .then(({ data: place }) => {
                            console.log(`Got place info for ${rawItem.visit.topCandidate.placeID}: `, place)
                            return {
                                name: place.displayName?.text ?? place.shortFormattedAddress ?? undefined,
                                address: place.shortFormattedAddress ?? "Unknown",
                            }
                        })
                        .catch(err => {
                            console.error(`Error getting place info for ${rawItem.visit.topCandidate.placeID}: `, err)
                            return {
                                name: undefined,
                                address: "Unknown - Error getting data from Google Maps",
                            }
                        })
                    // : { name: undefined, address: "Unknown" }
                console.log(`Got place info for ${rawItem.visit.topCandidate.placeID}: `, placeInfo)
                const out: GoogleLocationHistoryVisit = {
                    startTimestamp: rawItem.startTime,
                    endTimestamp: rawItem.endTime,
                    visit: {
                        hierarchyLevel: parseInt(rawItem.visit.hierarchyLevel),
                        topCandidate: {
                            probability: parseFloat(rawItem.visit.topCandidate.probability),
                            semanticType: rawItem.visit.topCandidate.semanticType,
                            placeID: rawItem.visit.topCandidate.placeID,
                            placeInfo: placeInfo,
                            placeLocation: stringToLatLong(rawItem.visit.topCandidate.placeLocation),
                        },
                        probability: parseFloat(rawItem.visit.probability),
                    },
                }
                return out
            } else if (isRawNewActivity(rawItem)) {
                const out : GoogleLocationHistoryActivity = {
                    startTimestamp: rawItem.startTime,
                    endTimestamp: rawItem.endTime,
                    activity: {
                        topCandidate: {
                            probability: parseFloat(rawItem.activity.topCandidate.probability),
                            type: rawItem.activity.topCandidate.type,
                        },
                        distanceMeters: parseInt(rawItem.activity.distanceMeters),
                        start: stringToLatLong(rawItem.activity.start),
                        end: stringToLatLong(rawItem.activity.end),
                    },
                }
                return out
            } else { return null }
        })
        const results = await Promise.all(promises)
        console.log(`Parsed ${results.length} items`)
        return results.filter(i => i != null)
    }
}

export interface NewGoogleLocationHistoryItem {
    startTime: string,
    endTime: string,
}
function isRawNewVisit(newItem: NewGoogleLocationHistoryItem): newItem is NewGoogleLocationHistoryVisit { return "visit" in newItem }
function isRawNewActivity(newItem: NewGoogleLocationHistoryItem): newItem is NewGoogleLocationHistoryActivity { return "activity" in newItem }
export interface NewGoogleLocationHistoryVisit extends NewGoogleLocationHistoryItem {
    visit: {
        hierarchyLevel: string,
        topCandidate: {
            probability: string,
            semanticType: string,
            placeID: string,
            placeLocation: string,
        },
        probability: string,
    }
}
export interface NewGoogleLocationHistoryActivity extends NewGoogleLocationHistoryItem {
    activity: {
        start: string,
        end: string,
        distanceMeters: string,
        topCandidate: {
            probability: string,
            type: string,
        },
    }
}