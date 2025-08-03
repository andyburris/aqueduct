import { Group, ID } from "jazz-tools";
import { experimental_useInboxSender, useAccount } from "jazz-tools/react";
import { useState } from "react";
import { FountainUserAccount, RegisterClientMessage } from "../../jazz";
import { Button } from "../common/Components";
import { Container } from "../common/Container";
import { getWorkerAccount, workerID } from "../common/JazzAndAuth";

export function OnboardingPage() {
    const [isSyncing, setIsSyncing] = useState(false)
    const sendToInbox = experimental_useInboxSender(workerID)
    const { me } = useAccount(FountainUserAccount, { resolve: { root: { integrations: { spotifyIntegration: {} }, syncState: {} } }})
    if(!me) return <p>Loading...</p>
    return (
        <Container>
            <div className="flex justify-center items-center w-full h-screen">
                <Button
                    kind="primary"
                    isDisabled={isSyncing}
                    onPress={async () => {
                        setIsSyncing(true)
                        console.log("pressed")
                        const worker = await getWorkerAccount()
                        if(!worker) { console.error("Worker account not found"); return }
                        const userIntegrations = me.root.integrations
                        const userIntegrationsGroup = userIntegrations?._owner?.castAs(Group)
                        if(userIntegrations && userIntegrationsGroup) {
                            console.log(`Registering worker = `, worker)
                            console.log("Sending integrations to worker", userIntegrations)
                            userIntegrationsGroup.addMember(worker, "writer")
                            const registerMessage = RegisterClientMessage.create({ integrations: userIntegrations, type: "register" })
                            sendToInbox(registerMessage)
                            me.root.syncState.applyDiff({ syncing: true })
                        } else throw new Error("User integrations not found")
                    }}>
                    <p>Start syncing</p>
                </Button>
            </div>
        </Container>
    )
}