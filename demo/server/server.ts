import { startWorker } from "jazz-tools/worker";
import { FountainIntegrations, InboxMessage, RegisterClientMessage, WorkerAccount } from "../jazz";
import { syncSpotify } from "./syncing/spotify-demo";
import { syncDrive } from "./syncing/drive-demo";
import { syncLocations } from "./syncing/location-history-demo";
import { syncPhotos } from "./syncing/photos-demo";
import { syncTana } from "./syncing/tana-demo";

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
        tanaIntegration: { isolatedNodes: { $each: true } },
        // googleIntegration: {},
       }})
      // await syncSpotify(loadedIntegrations.spotifyIntegration)
      // await syncDrive(loadedIntegrations.googleIntegration)
      // await syncLocations(loadedIntegrations.googleIntegration)
      // syncPhotos(loadedIntegrations.googleIntegration)
      syncTana(loadedIntegrations.tanaIntegration)

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
  RegisterClientMessage,
  async (message, senderID) => {
    // const userAccount = await FountainAccount.load(senderID, worker, {})
    // if (!userAccount) {
    //   console.error(`Received message from unknown account: ${senderID}`)
    //   return
    // }
    console.log("recieved message from", senderID, "message = ", message)
    const { type, integrations } = await message.ensureLoaded({ resolve: { integrations: { } } })
    switch (type) {
      case "register":
        workerAccount.root.integrations.push(integrations)
        break
      default:
        console.error(`Unknown inbox message type: ${type}`)
    }
  }
)


console.log("Worker started")