import { startWorker } from "jazz-nodejs";
import { InboxMessage, SpotifyMessage, WorkerAccount } from "../jazz/schema/worker";
import { syncSpotify } from "./syncing/spotify-demo";
import { SpotifyIntegration } from "../jazz/schema/integrations/spotify";

const localAddress = "ws://127.0.0.1:4200"

console.log("Starting worker...")



const { worker, experimental: { inbox } } = await startWorker({
  syncServer: localAddress,
  accountID: process.env.JAZZ_WORKER_ACCOUNT,
  accountSecret: process.env.JAZZ_WORKER_SECRET,
  AccountSchema: WorkerAccount,
})


const spotifyIntegration: SpotifyIntegration = await worker.root?.spotifyIntegration?.ensureLoaded(3)!
syncSpotify(spotifyIntegration)

inbox.subscribe(
  InboxMessage,
  async (message, senderID) => {
    // const userAccount = await FountainAccount.load(senderID, worker, {})
    // if (!userAccount) {
    //   console.error(`Received message from unknown account: ${senderID}`)
    //   return
    // }
    switch (message.type) {
      case "spotify":
        const spotifyMessage = message.castAs(SpotifyMessage)
        
        break
      default:
        console.error(`Unknown inbox message type: ${message.type}`)
    }
  }
)


console.log("Worker started")