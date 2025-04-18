"use client";

import { useAccount, useDemoAuth, usePasskeyAuth, usePassphraseAuth } from "jazz-react";
import { APPLICATION_NAME } from "./main";

export function AuthButton() {
  const { logOut } = useAccount();

  const auth = useDemoAuth();

  function handleLogOut() {
    logOut();
    window.history.pushState({}, "", "/");
  }

  if (auth.state === "signedIn") {
    return (
      <button
        className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
        onClick={handleLogOut}
      >
        Log out
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
        onClick={() => auth.signUp("test")}
      >
        Sign up
      </button>
      <button
        onClick={() => auth.logIn("test")}
        className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
      >
        Log in
      </button>
    </div>
  );
}
