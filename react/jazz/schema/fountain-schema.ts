/**
 * Learn about schemas here:
 * https://jazz.tools/docs/react/schemas/covalues
 */

import { Account, CoMap, Group, Profile, co } from "jazz-tools";
import { ListeningHistory, ListensList, PlaylistList, SpotifyIntegration } from "./integrations/spotify-integration";
import { EventList, MOCK_TEST_EVENTS, TestIntegration } from "./integrations/test-integration";
import { FileList, GoogleAuthentication, GoogleIntegration, LocationHistory, LocationHistoryList } from "./integrations/google-integration";

/** The account profile is an app-specific per-user public `CoMap`
 *  where you can store top-level objects for that user */
export class FountainProfile extends Profile {
  /**
   * Learn about CoValue field/item types here:
   * https://jazz.tools/docs/react/schemas/covalues#covalue-fielditem-types
   */
  name = co.string;

  // Add public fields here
}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class FountainRoot extends CoMap {
  integrations = co.ref(FountainIntegrations);
  syncState = co.ref(FountainSync);
}

export class FountainSync extends CoMap {
  syncing = co.boolean;
}

export class FountainIntegrations extends CoMap {
  spotifyIntegration = co.ref(SpotifyIntegration)
  googleIntegration = co.ref(GoogleIntegration)
  testIntegration = co.ref(TestIntegration)
}

export class FountainUserAccount extends Account {
  root = co.ref(FountainRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate() {
    const account = this
    // console.log("Migrating account", account.id, "root = ", this.root)
    if (this.root === undefined) {
      const group = Group.create()
      this.root = FountainRoot.create({
        integrations: FountainIntegrations.create({
          spotifyIntegration: SpotifyIntegration.create({ 
            playlists: PlaylistList.create([], group),
            listeningHistory: ListeningHistory.create({
              listens: ListensList.create([], group)
            }, group),
          }, group),
          googleIntegration: GoogleIntegration.create({ 
            authentication: GoogleAuthentication.create({}, group),
            files: FileList.create([], group),
            locations: LocationHistory.create({
              items: LocationHistoryList.create([], group),
            }, group),
          }, group),
          testIntegration: TestIntegration.create({
            events: EventList.create(MOCK_TEST_EVENTS(), group),
          }, group)
        }, group),
        syncState: FountainSync.create({ syncing: false }, account)
      }, account);
    }
    // console.log("Done migrating account", account.id, "root = ", this.root)
  }
}