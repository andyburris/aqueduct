import { JazzProvider } from "jazz-react";
import { Account, ID } from "jazz-tools";
import { FountainUserAccount, WorkerAccount } from "../../jazz";
// import { FountainUserAccount } from "../schema";

const localAddress = "ws://127.0.0.1:4200"

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
    return (
        <JazzProvider
            sync={{ 
                peer: localAddress,
            }}
            AccountSchema={FountainUserAccount}
        >
            {children}
        </JazzProvider>
    );
}
// Register the Account schema so `useAccount` returns our custom `FountainUserAccount`
declare module "jazz-react" {
    interface Register {
        Account: FountainUserAccount;
    }
}

// export const workerID = process.env.REACT_APP_JAZZ_WORKER_ACCOUNT!
export const workerID = "co_zJtWoMJDAkqW65iSB5C1rJVV1jb"
export async function getWorkerAccount(): Promise<WorkerAccount> {
    return (await Account.load(workerID! as ID<Account>, {}))! as WorkerAccount
}