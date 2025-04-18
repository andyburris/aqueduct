import { Account, co, CoList, CoMap, Group, SchemaUnion } from "jazz-tools";
import { FountainIntegrations } from "./fountain-schema";

export class BaseInboxMessage extends CoMap {
    type = co.literal("register");
}

export class RegisterClientMessage extends BaseInboxMessage {
    type = co.literal("register");
    integrations = co.ref(FountainIntegrations)
}

export const InboxMessage = SchemaUnion.Of<BaseInboxMessage>(raw => {
    switch (raw.get("type")) {
        case "register": return RegisterClientMessage;
        default: throw new Error(`Unknown inbox message type: ${raw.type}`)
    }
})

export class WorkerAccount2 extends Account {}

export class WorkerAccount extends Account {
    root = co.ref(WorkerRoot)

    migrate(this: WorkerAccount) {
        const account = this
        if (this.root === undefined) {
            const group = Group.create({ owner: account })
            this.root = WorkerRoot.create({
                integrations: IntegrationList.create([], group),
            }, account);
        }
    }
}

class IntegrationList extends CoList.Of(co.ref(FountainIntegrations)) {}
export class WorkerRoot extends CoMap {
    integrations = co.ref(IntegrationList)
}

