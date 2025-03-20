import { AccessToken } from "@spotify/web-api-ts-sdk";
import { Account, co, CoMap, SchemaUnion, CoList } from "jazz-tools";
import { SpotifyIntegration } from "./integrations/spotify";

export class BaseInboxMessage extends CoMap {
    type = co.literal("spotify");
}

export class SpotifyMessage extends BaseInboxMessage {
    type = co.literal("spotify");
    token = co.json<Required<AccessToken>>();
}

export const InboxMessage = SchemaUnion.Of<BaseInboxMessage>(raw => {
    switch (raw.get("type")) {
        case "spotify": return SpotifyMessage;
        default: throw new Error(`Unknown inbox message type: ${raw.type}`)
    }
})


export class WorkerAccount extends Account {
    root = co.ref(WorkerRoot)
}

export class WorkerRoot extends CoMap {
    spotifyIntegration = co.ref(SpotifyIntegration)
}

