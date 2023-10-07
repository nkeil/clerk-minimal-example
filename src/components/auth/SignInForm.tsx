import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSignIn } from "@clerk/nextjs";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";

interface SignInInput {
  email: string;
  password: string;
}

type OauthStrategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

interface Props {
  callback: string;
  showSsoForm: boolean;
  setShowSsoForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const SignInForm = ({ callback, setShowSsoForm }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSsoOption, setShowSsoOption] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStrategy, setIsLoadingStrategy] = useState<
    null | OauthStrategy | "password"
  >(null);

  const { handleSubmit, register, setValue, control } = useForm<SignInInput>();
  const email = useWatch<SignInInput>({ name: "email", control });
  const values = useWatch<SignInInput>({ control });

  const { signIn, setActive } = useSignIn();
  const router = useRouter();

  const sendCode = async () => {
    if (signIn && !isLoading) {
      const emailFactor = signIn.supportedFirstFactors.find(
        (sff) => sff.strategy === "email_code"
      );

      if (emailFactor && emailFactor.strategy === "email_code") {
        setIsLoading(true);
        setIsLoadingStrategy("password");

        const res = await signIn
          .prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          })
          .catch((e) => {
            setError(e.errors[0]?.longMessage as string);
            console.error("prepareFirstFactor", { e });
          })
          .finally(() => {
            setIsLoadingStrategy(null);
            setIsLoading(false);
          });

        if (res) {
          setShowSsoForm(true);
        }

        return res;
      }
    }
  };

  const submit: SubmitHandler<SignInInput> = async (values) => {
    if (!showPasswordField) {
      if (signIn) {
        setIsLoading(true);
        setIsLoadingStrategy("password");

        const res = await signIn
          .create({ identifier: email })
          .catch((e) => {
            console.error({ e });
            setError(e.errors[0]?.longMessage as string);
          })
          .finally(() => {
            setIsLoading(false);
            setIsLoadingStrategy(null);
          });

        if (res) {
          const supportsPassword = res.supportedFirstFactors.some(
            (sff) => sff.strategy === "password"
          );

          const emailFactor = res.supportedFirstFactors.find(
            (sff) => sff.strategy === "email_code"
          );

          const supportsEmailCode = !!emailFactor;

          setShowPasswordField(supportsPassword);
          setShowSsoOption(supportsEmailCode);
          if (
            !supportsPassword &&
            emailFactor &&
            emailFactor.strategy === "email_code"
          ) {
            await sendCode().catch((e: Error) => {
              console.error({ e });
            });
          }
        }
      }
    } else {
      setIsLoading(true);
      setIsLoadingStrategy("password");
      const res = await signIn
        ?.create({ identifier: values.email, password: values.password })
        .catch((e) => {
          console.error({ e });
          setError(e.errors[0]?.longMessage as string);
        })
        .finally(() => {
          setIsLoading(false);
          setIsLoadingStrategy(null);
        });

      if (res?.status === "complete") {
        await setActive?.({ session: res.createdSessionId });
        void router.push(callback);
      } else {
        switch (res?.status) {
          case "needs_first_factor":
            setError("Password required");
            break;

          case "needs_identifier":
            setError("Email must be provided");
            break;

          case "needs_new_password":
            setError("New password required");
            break;

          case "needs_second_factor":
            setError("2 Factor authentication required");
            break;
        }
      }
    }
  };

  const signInWith = (strategy: OauthStrategy) => async () => {
    setIsLoading(true);
    setIsLoadingStrategy(strategy);
    await signIn
      ?.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: callback,
      })
      .catch((e) => {
        console.error(e);
        setError(e.errors[0]?.longMessage as string);
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingStrategy(null);
      });
  };

  useEffect(() => {
    setShowPasswordField(false);
  }, [email]);

  useEffect(() => {
    setValue("password", "");
    setShowPassword(false);
  }, [showPasswordField]);

  useEffect(() => {
    setError(null);
  }, [values]);

  return (
    <>
      <p>Sign in</p>
      <div>
        <button disabled={isLoading} onClick={signInWith("oauth_google")}>
          {loadingStrategy === "oauth_google" ? "Loading..." : "Google"}
        </button>
        <button disabled={isLoading} onClick={signInWith("oauth_facebook")}>
          {loadingStrategy === "oauth_facebook" ? "Loading..." : "Facebook"}
        </button>
        <button disabled={isLoading} onClick={signInWith("oauth_apple")}>
          {loadingStrategy === "oauth_apple" ? "Loading..." : "Apple"}
        </button>
      </div>

      <div>
        <div />
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit(submit)}>
        <input
          {...register("email", {
            required: true,
          })}
          type="email"
          placeholder="Email Address"
        />

        <input
          {...register("password", { required: showPasswordField })}
          type={showPassword ? "text" : "password"}
          placeholder="Enter Password"
        />

        {showSsoOption && (
          <button type="button" onClick={sendCode}>
            <span>Send Code Instead</span>
          </button>
        )}

        {error != null && <p>{error}</p>}

        <button type="submit" disabled={isLoading}>
          {loadingStrategy === "password"
            ? "Loading..."
            : showPasswordField
            ? "Sign In"
            : "Continue"}
        </button>
      </form>
    </>
  );
};

export default SignInForm;
