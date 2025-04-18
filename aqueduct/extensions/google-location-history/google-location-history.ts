import { places_v1 } from "googleapis";
import { fetchDiff } from "../../fetch";

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

export class GoogleLocationHistoryExtension {
    private placesClient: places_v1.Places
    
    constructor() {
        this.placesClient = new places_v1.Places({ auth: process.env.GOOGLE_MAPS_API_KEY! })
    }

    async parseCurrentLocationHistory(json: RawGoogleLocationHistoryItem[], previousLocationHistory: GoogleLocationHistoryItem[]): Promise<GoogleLocationHistoryItem[]> {
        const visitsAndActivities = json.filter(i => "visit" in i || "activity" in i)
        const results = await fetchDiff({
            currentItems: visitsAndActivities,
            storedItems: previousLocationHistory,
            currentIdentifier: (raw) => raw.startTime + "|" + raw.endTime + "|" + (isRawVisit(raw) ? raw.visit.topCandidate.placeLocation : raw.activity.start),
            storedIdentifier: l => l.startTimestamp + "|" + l.endTimestamp + "|" + ("visit" in l ? l.visit.topCandidate.placeLocation : (l.activity.start.latitude + "," + l.activity.start.longitude)),
            createCache: (storedItems) => new Map(storedItems.filter(l => "visit" in l).map(l => [l.visit.topCandidate.placeID, { name: l.visit.topCandidate.placeInfo.name, address: l.visit.topCandidate.placeInfo.address }])),
            keepStaleItems: true,
            convert: {
                each: async (rawItem, placeInfoCache) => {
                    // console.log(`Parsing item: ${JSON.stringify(rawItem)}`)
                    if (isRawVisit(rawItem)) {
                        // console.log(`Getting place info for ${rawItem.visit.topCandidate.placeID}`)
                        const placeInfo = placeInfoCache.has(rawItem.visit.topCandidate.placeID)
                            ? placeInfoCache.get(rawItem.visit.topCandidate.placeID)!
                            : await this.placesClient.places
                                .get({ 
                                    name: `places/${rawItem.visit.topCandidate.placeID}`,
                                    fields: "shortFormattedAddress,displayName",
                                })
                                .then(({ data: place }) => {
                                    // console.log(`Got place info for ${rawItem.visit.topCandidate.placeID}: `, place)
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
                    } else {
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
                    }
                }
            }
        })
        console.log(`Parsed ${results.allItems.length} items`)
        return results.allItems
    }
}

export type RawGoogleLocationHistoryItem = RawGoogleLocationHistoryActivity | RawGoogleLocationHistoryVisit
function isRawVisit(newItem: RawGoogleLocationHistoryItem): newItem is RawGoogleLocationHistoryVisit { return "visit" in newItem }
function isRawActivity(newItem: RawGoogleLocationHistoryItem): newItem is RawGoogleLocationHistoryActivity { return "activity" in newItem }
export interface RawGoogleLocationHistoryVisit {
    startTime: string,
    endTime: string,
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
export interface RawGoogleLocationHistoryActivity {
    startTime: string,
    endTime: string,
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