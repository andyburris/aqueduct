import { unzip, unzipRaw, ZipEntry, ZipInfo } from 'unzipit';

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
            placeLocation: LatLong,
        },
        probability: number,
    }
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
    }
}

export class GoogleTakeoutExtension {
    constructor() {}

    public async unzipFiles(files: File[]) {
        const zips = await Promise.all(files.map(async f => await unzip(await f.arrayBuffer())))
        const allEntries = zips.reduce((acc, zi) => { return {...acc, ...zi.entries } }, {})
    }

    async extractLegacyLocationHistory(entries: { [key: string]: ZipEntry }) {
        const records = await entries["Takeout/Location History (Timeline)/Records.json"].json()

    }

    async parseCurrentLocationHistory(json: NewGoogleLocationHistoryItem[]): Promise<GoogleLocationHistoryItem[]> {
        return json.map(rawItem => {
            if (isRawNewVisit(rawItem)) {
                return {
                    startTimestamp: rawItem.startTime,
                    endTimestamp: rawItem.endTime,
                    visit: {
                        hierarchyLevel: parseInt(rawItem.visit.hierarchyLevel),
                        topCandidate: {
                            probability: parseFloat(rawItem.visit.topCandidate.probability),
                            semanticType: rawItem.visit.topCandidate.semanticType,
                            placeID: rawItem.visit.topCandidate.placeID,
                            placeLocation: stringToLatLong(rawItem.visit.topCandidate.placeLocation),
                        },
                        probability: parseFloat(rawItem.visit.probability),
                    },
                }
            } else if (isRawNewActivity(rawItem)) {
                return {
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
            } else { return null }
        }).filter(i => i != null)
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