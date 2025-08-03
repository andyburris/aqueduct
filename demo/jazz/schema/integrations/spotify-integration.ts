import { AccessTokenSchema, FullSpotifyPlaylistSchema, SpotifyListenSchema } from "integration-spotify";
import { co, z } from "jazz-tools";
import { Integration, SyncFlow } from "../integrations";

export const ListeningHistory = co.map({
    ...SyncFlow.shape,
    listens: co.list(SpotifyListenSchema),
    fileInProcess: co.fileStream().optional(),
})
export const Playlists = co.map({
    ...SyncFlow.shape,
    items: co.list(FullSpotifyPlaylistSchema),
})
export const SpotifyIntegration = co.map({
    ...Integration.shape,
    authentication: AccessTokenSchema.optional(),
    playlists: Playlists,
    listeningHistory: ListeningHistory,
})

// const NestedSchema = z.object({
//     // Type '{ name?: string | undefined; }' is not assignable to type '{ name: string | undefined; }'.
//     //   Property 'name' is optional in type '{ name?: string | undefined; }' but required in type '{ name: string | undefined; }'.ts(2322)
//     name: z.string().optional(),
// })
// type NestedType = z.infer<typeof NestedSchema>
// const ParentSchema = co.map({ obj: NestedSchema, })

// function createParentItem() {
//     const nested: NestedType = { name: "Test Item" };
//     return ParentSchema.create({ obj/*error occurs here*/: nested });
// }