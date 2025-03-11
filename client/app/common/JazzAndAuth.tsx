import { JazzProvider } from "jazz-react";
import { FountainUserAccount } from "@/../jazz/schema/fountain-schema";

const localAddress = "ws://127.0.0.1:4200"

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
    return (
        <JazzProvider
            sync={{ 
                peer: localAddress,
                when: "signedUp",
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