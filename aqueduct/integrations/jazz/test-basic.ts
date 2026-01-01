import { Account } from "jazz-tools";


export function test(account: Account) {
  account.$jazz.id; 
}

const account: Account = {} as unknown as Account;
test(account);