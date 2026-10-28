"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button type="button" className="btn btn--quiet btn--sm" onClick={handleSignOut}>
      Sign out of account
    </button>
  );
}
