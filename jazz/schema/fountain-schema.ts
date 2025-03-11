/**
 * Learn about schemas here:
 * https://jazz.tools/docs/react/schemas/covalues
 */

import { Account, CoMap, Profile, co } from "jazz-tools";
// import { SpotifyIntegration } from "./integrations/spotify";

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
  // spotifyIntegration = co.ref(SpotifyIntegration)
}

export class FountainUserAccount extends Account {
  root = co.ref(FountainRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate() {
    const account = this
    console.log("creating account, root = ", this.root, "_refs.root = ", this._refs.root)
    if (this.root === undefined) {
      this.root = FountainRoot.create({
        // spotifyIntegration: SpotifyIntegration.create({}, account)
      }, account);
    //   this.root = FountainRoot.create(
    //     {
    //       // spotifyIntegration: SpotifyIntegration.create({}, { owner: this }),
    //     },
    //     account,
    //   );
    }
    console.log("done creating account, root = ", this.root, "_refs.root = ", this._refs.root)
  }
}