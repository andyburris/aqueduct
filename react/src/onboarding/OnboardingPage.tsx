import { RegisterClientMessage } from "../../jazz";
import { experimental_useInboxSender, useAccount } from "jazz-react";
import { Group, ID, RegisteredAccount } from "jazz-tools";
import { useState } from "react";
import { Button } from "../common/Components";
import { Container } from "../common/Container";
import { getWorkerAccount, workerID } from "../common/JazzAndAuth";

export function OnboardingPage() {
    const [isSyncing, setIsSyncing] = useState(false)
    const sendToInbox = experimental_useInboxSender(workerID as ID<RegisteredAccount>)
    const { me } = useAccount({ resolve: { root: { integrations: { spotifyIntegration: {} }, syncState: {} } }})
    if(!me) return <p>Loading...</p>
    return (
        <Container>
            <p>Currently syncing = {`${me.root.syncState.syncing}`}</p>
            <Button
                isDisabled={isSyncing}
                onPress={async () => {
                    setIsSyncing(true)
                    console.log("pressed")
                    const worker = await getWorkerAccount()
                    const userIntegrations = me.root.integrations
                    const userInegrationsGroup = userIntegrations?._owner?.castAs(Group)
                    userInegrationsGroup?.addMember(worker, "writer")
                    if(userIntegrations) {
                        const registerMessage = RegisterClientMessage.create({ integrations: userIntegrations, type: "register" })
                        sendToInbox(registerMessage)
                        me.root.syncState.applyDiff({ syncing: true })
                    } else throw new Error("User integrations not found")
                }}>
                <p>Start syncing</p>
            </Button>
        </Container>
    )
}