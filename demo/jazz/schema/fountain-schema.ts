import { co, Group, z } from "jazz-tools";
import { ListeningHistory, ListensList, PlaylistList, Playlists, SpotifyIntegration } from "./integrations/spotify-integration";
import { EventList, MOCK_TEST_EVENTS, TestIntegration } from "./integrations/test-integration";
import { DriveFiles, DriveFileList, GoogleAuthentication, GoogleIntegration, LocationHistory, LocationHistoryList, GooglePhotos, GooglePhotosList } from "./integrations/google-integration";

export const FountainProfile = co.profile({
  name: z.string()
})

export const FountainSync = co.map({
  syncing: z.boolean()
})

export const FountainIntegrations = co.map({
  spotifyIntegration: SpotifyIntegration,
  googleIntegration: GoogleIntegration,
  testIntegration: TestIntegration
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
    const group = Group.create()
    account.root = FountainRoot.create({
      integrations: FountainIntegrations.create({
        spotifyIntegration: SpotifyIntegration.create({ 
          playlists: Playlists.create({
            items: PlaylistList.create([], group)
          }, group),
          listeningHistory: ListeningHistory.create({
            listens: ListensList.create([], group)
          }, group),
        }, group),
        googleIntegration: GoogleIntegration.create({ 
          authentication: GoogleAuthentication.create({}, group),
          files: DriveFiles.create({
            items: DriveFileList.create([], group),
          }, group),
          locations: LocationHistory.create({
            items: LocationHistoryList.create([], group),
          }, group),
          photos: GooglePhotos.create({
            items: GooglePhotosList.create([], group),
          }, group)
        }, group),
        testIntegration: TestIntegration.create({
          events: EventList.create(MOCK_TEST_EVENTS(), group),
        }, group)
      }, group),
      syncState: FountainSync.create({ syncing: false }, account)
    }, account);
  }
})