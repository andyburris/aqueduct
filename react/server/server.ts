import { startWorker } from "jazz-nodejs";
import { InboxMessage, RegisterClientMessage, WorkerAccount } from "../jazz";
import { syncSpotify } from "./syncing/spotify-demo";
import { syncDrive } from "./syncing/drive-demo";
import { syncLocations } from "./syncing/location-history-demo";

const localAddress = "ws://127.0.0.1:4200"

console.log("Starting worker...")

const { worker, experimental: { inbox } } = await startWorker({
  syncServer: localAddress,
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
  AccountSchema: WorkerAccount,
})

console.log("Created worker")

const runningAccounts = new Map<string, () => void>
const workerAccount = await worker.ensureLoaded({ resolve: { root: { integrations: { $each: {} } } }})
await workerAccount.root.integrations.subscribe(
  { resolve: { $each: {} } },
  (integrations) => {
    console.log("Updated integrations", integrations)
    const newAccounts = integrations.filter(i => !runningAccounts.has(i.id))
    const deletedAccounts = Array.from(runningAccounts.keys()).filter(id => !integrations.some(i => id == i.id))
    
    // start syncing any new accounts
    newAccounts.forEach(async newA => {
      console.log("Syncing integrations for account", newA.id)
      const loadedIntegrations = await newA.ensureLoaded({ resolve: { 
        spotifyIntegration: {},
        googleIntegration: {},
       }})
      await syncSpotify(loadedIntegrations.spotifyIntegration)
      await syncDrive(loadedIntegrations.googleIntegration)
      await syncLocations(loadedIntegrations.googleIntegration)

      runningAccounts.set(newA.id, () => { 
        console.log("Unsubscribing for account", newA.id)
        // unsubscribe()
      })
    })

    // and stop syncing any that no longer exist
    deletedAccounts.forEach(id => {
      runningAccounts.get(id)?.()
      runningAccounts.delete(id)
    })
  },
)

inbox.subscribe(
  InboxMessage,
  async (message, senderID) => {
    // const userAccount = await FountainAccount.load(senderID, worker, {})
    // if (!userAccount) {
    //   console.error(`Received message from unknown account: ${senderID}`)
    //   return
    // }
    console.log("recieved message from", senderID, "message = ", message)
    switch (message.type) {
      case "register":
        const registerMessage: RegisterClientMessage = message.castAs(RegisterClientMessage);
        workerAccount.root.integrations.push(registerMessage.integrations)
        break
      default:
        console.error(`Unknown inbox message type: ${message.type}`)
    }
  }
)


console.log("Worker started")