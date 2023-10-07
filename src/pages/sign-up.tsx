import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";
import LogoControl from "~/components/common/HomeButton";
import SignUpForm from "~/components/auth/SignUpForm";
import SsoForm from "~/components/auth/SsoForm";

const DEFAULT_SIGN_UP_CALLBACK = "/";

interface RouterQuery {
  callback?: string;
}

const Index = () => {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [showSsoForm, setShowSsoForm] = useState(false);

  let { callback } = router.query as unknown as RouterQuery;
  callback = callback ?? DEFAULT_SIGN_UP_CALLBACK;

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
        <SignUpForm
          callback={callback}
          showSsoForm={showSsoForm}
          setShowSsoForm={setShowSsoForm}
        />
      )}

      {showSsoForm && (
        <SsoForm
          authType="signup"
          callback={callback}
          showSsoForm={showSsoForm}
          setShowSsoForm={setShowSsoForm}
        />
      )}
    </div>
  );
};

export default Index;
