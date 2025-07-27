import { ZipEntry } from 'unzipit';

export interface GooglePhotoMetadata {
    title: string;
    description: string;
    imageViews: string;
    creationTime: {
        timestamp: string;
        formatted: string;
    };
    photoTakenTime: {
        timestamp: string;
        formatted: string;
    };
    geoData: {
        latitude: number;
        longitude: number;
        altitude: number;
        latitudeSpan: number;
        longitudeSpan: number;
    };
    geoDataExif: {
        latitude: number;
        longitude: number;
        altitude: number;
        latitudeSpan: number;
        longitudeSpan: number;
    };
    url: string;
    googlePhotosOrigin: {
        webUpload?: {
            computerUpload?: {};
        };
    };
}
export interface GooglePhotoWithMetadata {
    photo: Blob;
    metadata: GooglePhotoMetadata;
}
export class GooglePhotosExtension {
    public async parseTakeoutFiles(entries: { [key: string]: ZipEntry }): Promise<GooglePhotoWithMetadata[]> {
        const entryNames = Object.keys(entries);
        const photoEntries = entryNames.filter(name => name.startsWith("Takeout/Google Photos/Photos from")); //TODO: check for undated

        console.log("photo entries = ", photoEntries)
        if(photoEntries.length === 0) {
            console.log("No photos found in takeout files, all entryNames = ", entryNames)
        }

        const allMetadata = photoEntries.filter(name => name.endsWith(".json"))
        console.log(`starting parsing ${allMetadata.length} photos`)
        const photosWithMetadata: GooglePhotoWithMetadata[] = (await Promise.allSettled(allMetadata.map(async (name, i) => {
            // console.log(`parsing photo ${i + 1} of ${allMetadata.length} (${name})`)
            const photoName = name.slice(0, -".supplemental-metadata.json".length)
            // console.log(`got name for photo ${i + 1} of ${allMetadata.length} (${photoName})`)
            if(!entries[photoName]) {
                console.error(`No photo found for ${photoName}, all entries = `, Object.keys(entries))
                throw new Error(`No photo found for ${photoName}`)
            }
            const photo = await entries[photoName].blob().catch(err => { console.error("Error getting blob for photo", err); throw err })
            // console.log(`got blob for photo ${i + 1} of ${allMetadata.length} (${photoName})`)
            const metadata = await entries[name].json().catch(err => { console.error("Error getting json for photo", err); throw err }) as GooglePhotoMetadata
            console.log(`done parsing photo ${i + 1} of ${allMetadata.length} (${photoName})`)
            return { photo: photo, metadata: metadata }
        })))
            .filter(result => result.status === "fulfilled")
            .map(result => (result as PromiseFulfilledResult<GooglePhotoWithMetadata>).value)

        console.log("done parsing photos")
        return photosWithMetadata
    }
}