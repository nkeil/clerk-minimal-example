import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

import Link from "next/link";
import LogoControl from "~/components/common/HomeButton";
import SignInForm from "~/components/auth/SignInForm";
import SsoForm from "~/components/auth/SsoForm";

const DEFAULT_SIGN_IN_CALLBACK = "/";

interface RouterQuery {
  callback?: string;
}

const Index = () => {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [showSsoForm, setShowSsoForm] = useState(false);

  let { callback } = router.query as unknown as RouterQuery;
  callback = callback ?? DEFAULT_SIGN_IN_CALLBACK;

  if (!isLoaded) return "Loading...";
  if (isSignedIn) {
    return (
      <div>
        You are already signed in. Click <Link href="/dashboard">here</Link> to
        go to the dashboard.
      </div>
    );
  }

  return (
    <div>
      <LogoControl />

      {!showSsoForm && (
        <SignInForm
          callback={callback}
          showSsoForm={showSsoForm}
          setShowSsoForm={setShowSsoForm}
        />
      )}
      {showSsoForm && (
        <SsoForm
          authType="signin"
          callback={callback}
          showSsoForm={showSsoForm}
          setShowSsoForm={setShowSsoForm}
        />
      )}
    </div>
  );
};

export default Index;
