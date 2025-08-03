import { Account, co, Group, z } from "jazz-tools";
import { FountainIntegrations } from "./fountain-schema";

export const BaseInboxMessage = co.map({
    type: z.literal("register"),
});

export const RegisterClientMessage = co.map({
    type: z.literal("register"),
    integrations: FountainIntegrations
});

export const InboxMessage = co.discriminatedUnion("type", [
    RegisterClientMessage
]);

export const WorkerRoot = co.map({
    integrations: co.list(FountainIntegrations)
});

export const WorkerAccount = co.account({
    root: WorkerRoot,
    profile: co.profile()
}).withMigration((account) => {
    if (account.root === undefined) {
        const group = Group.create()
        account.root = WorkerRoot.create({
            integrations: co.list(FountainIntegrations).create([], group),
        }, account);
    }
});

