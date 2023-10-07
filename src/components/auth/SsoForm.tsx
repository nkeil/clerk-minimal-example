import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";

interface SsoInput {
  code: string;
}

const SsoForm = ({
  callback,
  setShowSsoForm,
  authType,
}: {
  callback: string;
  showSsoForm: boolean;
  authType: "signup" | "signin";
  setShowSsoForm: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canSendCode, setCanSendCode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const nextAvailableTime = useRef(new Date(Date.now() + 10 * 1000));

  const emailFactor = useMemo(
    () =>
      signIn?.supportedFirstFactors.find(
        (sff) => sff.strategy === "email_code"
      ),
    [signIn]
  );

  const router = useRouter();

  const verifyCode = async (code: string) => {
    if (authType === "signin") {
      if (signIn && !isLoading) {
        setIsLoading(true);

        const res = await signIn
          .attemptFirstFactor({
            strategy: "email_code",
            code,
          })
          .catch((e) => {
            setError((e.errors[0]?.longMessage as string) || null);
            console.error("attemptFirstFactor", { e });
          })
          .finally(() => {
            setIsLoading(false);
          });

        return res;
      }
    }

    if (authType === "signup") {
      if (signUp && !isLoading) {
        setIsLoading(true);

        const res = await signUp
          .attemptEmailAddressVerification({
            code,
          })
          .catch((e) => {
            setError((e.errors[0]?.longMessage as string) || null);
            console.error("attemptFirstFactor", { e });
          })
          .finally(() => {
            setIsLoading(false);
          });

        return res;
      }
    }
  };

  const sendCode = async () => {
    if (authType === "signin") {
      if (signIn && canSendCode && !isLoading) {
        const emailFactor = signIn.supportedFirstFactors.find(
          (sff) => sff.strategy === "email_code"
        );

        if (emailFactor && emailFactor.strategy === "email_code") {
          setIsLoading(true);

          const res = await signIn
            .prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            })
            .catch((e) => {
              setError((e.errors[0]?.longMessage as string) || null);
              console.error("prepareFirstFactor", { e });
            })
            .finally(() => {
              setIsLoading(false);
            });

          nextAvailableTime.current = new Date(Date.now() + 60 * 1000);

          return res;
        }
      }
    }

    if (authType === "signup") {
      if (signUp && !isLoading) {
        setIsLoading(true);
        const res = await signUp
          .prepareEmailAddressVerification({ strategy: "email_code" })
          .catch((e) => {
            setError((e.errors[0]?.longMessage as string) || null);
            console.error("prepareEmailAddressVerification", { e });
          })
          .finally(() => {
            setIsLoading(false);
          });

        nextAvailableTime.current = new Date(Date.now() + 60 * 1000);

        return res;
      }
    }
  };

  const onSubmit: SubmitHandler<SsoInput> = async (values) => {
    const res = await verifyCode(values.code);

    if (res) {
      if (res.status === "complete") {
        if (authType === "signin") {
          await setActiveSignIn?.({ session: res.createdSessionId });
        }
        if (authType === "signup") {
          await setActiveSignUp?.({ session: res.createdSessionId });
        }
        void router.push(callback);
      }
    }
  };

  const { control, register, handleSubmit } = useForm<SsoInput>();
  const values = useWatch({ control });
  const code = useWatch({ name: "code", control });

  useEffect(() => {
    setError(null);
  }, [values]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const nextTime = nextAvailableTime.current.getTime();
      const canSendCodeNow = currentTime >= nextTime;
      setCanSendCode(canSendCodeNow);
      if (!canSendCode) {
        setTimeRemaining(nextTime - currentTime);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div>
        <div>
          <h2>Verification Code</h2>

          <span
            onClick={() => {
              setShowSsoForm(false);
            }}
          >
            Back
          </span>
        </div>

        <p>A code has been sent to your email</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("code", {
            required: true,
            minLength: 4,
          })}
          type="text"
          placeholder="Verification Code"
        />

        <div>
          {error != null && <p>{error}</p>}

          <button type="submit" disabled={!code}>
            {isLoading ? "Loading" : "Verify"}
          </button>
        </div>

        <p>
          Didn&apos;t get the code? <span onClick={sendCode}>resend</span>{" "}
          {!canSendCode && timeRemaining > 0 && !!emailFactor && (
            <span>{Math.round(timeRemaining / 1000)}s</span>
          )}
        </p>
      </form>
    </>
  );
};

export default SsoForm;
