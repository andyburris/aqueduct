import { co, Group, z } from "jazz-tools";
import { ListeningHistory, Playlists, SpotifyIntegration } from "./integrations/spotify-integration";
import { EventList, MOCK_TEST_EVENTS, TestIntegration } from "./integrations/test-integration";
import { FullSpotifyPlaylistSchema, SpotifyListenSchema } from "integration-spotify";
import { TanaIntegration } from "./integrations/tana-integration";
import { IsolatedTanaNodeSchema, TanaRootNodeSchema } from "integration-tana";
// import { DriveFiles, DriveFileList, GoogleAuthentication, GoogleIntegration, LocationHistory, LocationHistoryList, GooglePhotos, GooglePhotosList } from "./integrations/google-integration";

export const FountainProfile = co.profile({
  name: z.string()
})

export const FountainSync = co.map({
  syncing: z.boolean()
})

export const FountainIntegrations = co.map({
  spotifyIntegration: SpotifyIntegration,
  // googleIntegration: GoogleIntegration,
  testIntegration: TestIntegration,
  tanaIntegration: TanaIntegration,
})

export const FountainRoot = co.map({
  integrations: FountainIntegrations,
  syncState: FountainSync
})

export const FountainUserAccount = co.account({
  profile: FountainProfile,
  root: FountainRoot,
}).withMigration((account) => {
  // console.log("Migrating account", account.id, "root = ", this.root)
  if (account.root === undefined) {
    const userGroup = Group.create()
    const workerGroup = Group.create()
    account.root = FountainRoot.create({
      integrations: FountainIntegrations.create({
        spotifyIntegration: SpotifyIntegration.create({ 
          playlists: Playlists.create({
            items: co.list(FullSpotifyPlaylistSchema).create([], workerGroup)
          }, workerGroup),
          listeningHistory: ListeningHistory.create({
            listens: co.list(SpotifyListenSchema).create([], workerGroup),
          }, workerGroup),
        }, workerGroup),
        // googleIntegration: GoogleIntegration.create({ 
        //   authentication: GoogleAuthentication.create({}, workerGroup),
        //   files: DriveFiles.create({
        //     items: DriveFileList.create([], workerGroup),
        //   }, workerGroup),
        //   locations: LocationHistory.create({
        //     items: LocationHistoryList.create([], workerGroup),
        //   }, workerGroup),
        //   photos: GooglePhotos.create({
        //     items: GooglePhotosList.create([], workerGroup),
        //   }, workerGroup)
        // }, workerGroup),
        testIntegration: TestIntegration.create({
          events: EventList.create(MOCK_TEST_EVENTS(), workerGroup),
        }, workerGroup),
        tanaIntegration: TanaIntegration.create({
          isolatedNodes: co.list(IsolatedTanaNodeSchema).create([], workerGroup)
        }, workerGroup)
      }, workerGroup),
      syncState: FountainSync.create({ syncing: false }, account)
    }, userGroup);
  }
})