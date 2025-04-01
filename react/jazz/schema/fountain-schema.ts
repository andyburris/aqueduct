/**
 * Learn about schemas here:
 * https://jazz.tools/docs/react/schemas/covalues
 */

import { Account, CoList, CoMap, Group, Profile, co } from "jazz-tools";
import { PlaylistList, SpotifyIntegration } from "./integrations/spotify";
import { MOCK_PLAYLISTS } from "../../src/home/mocks";
import { MOCK_TEST_NOTES, MOCK_TEST_NOTES_JSON, MOCK_TEST_NOTES_STRING, NoteList, TestIntegration } from "./integrations/test-integration";

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
            playlists: PlaylistList.create([], group)
          }, group),
          testIntegration: TestIntegration.create({
            notes: NoteList.create(MOCK_TEST_NOTES(), group)
          }, group)
        }, group),
        syncState: FountainSync.create({ syncing: false }, account)
      }, account);
    }
    // console.log("Done migrating account", account.id, "root = ", this.root)
  }
}