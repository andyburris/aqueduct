import { Account, co, ID } from "jazz-tools";
import { JazzReactProvider } from "jazz-tools/react";
import { FountainUserAccount, WorkerAccount } from "../../jazz";
import { JazzInspector } from "jazz-tools/inspector";
// import { FountainUserAccount } from "../schema";

const localAddress = "ws://127.0.0.1:4200"

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
    return (
        <JazzReactProvider
            sync={{ 
                peer: localAddress,
            }}
            AccountSchema={FountainUserAccount}
        >
            {children}
            <JazzInspector/>
        </JazzReactProvider>
    );
}

// export const workerID = process.env.REACT_APP_JAZZ_WORKER_ACCOUNT!
export const workerID = "co_zZfF6epuyoM1bVLhvy7LY6mYJ8n"
export async function getWorkerAccount() {
    return co.account().load(workerID)
}