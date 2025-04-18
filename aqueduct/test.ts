import * as googleapis from "googleapis"

console.log("Initializing places client")

const places2 = new googleapis.places_v1.Places({ auth: process.env.GOOGLE_MAPS_API_KEY! })

const placeID = "ChIJt_eRIKbJt4kRQZdFQBH54Z4"
const info2 = await places2.places.get({
    name: `places/${placeID}`,
    fields: "shortFormattedAddress,displayName",
}).then(({ data: place }) => {
    console.log(`Got place info for ${placeID}: `, place)
    return {
        name: place.displayName?.text ?? place.shortFormattedAddress ?? undefined,
        address: place.shortFormattedAddress ?? "Unknown",
    }
})
.catch(err => console.error(`Error getting place info for ${placeID}: `, err))
// const info = await places.getPlace(
//     { 
//     name: `places/${placeID}`,
//     }, 
//     {
//         otherArgs: {
//             headers: {
//                 'X-Goog-FieldMask': 'places.shortFormattedAddress',
//             },
//         },
//     })
//     .then(([place]) => {
//         console.log(`Got place info for ${placeID}: `, place)
//         return {
//             name: place.displayName?.text ?? place.shortFormattedAddress ?? undefined,
//             address: place.shortFormattedAddress ?? "Unknown",
//         }
//     })
//     .catch(err => console.error(`Error getting place info for ${placeID}: `, err))
console.log("got info: ", info2)