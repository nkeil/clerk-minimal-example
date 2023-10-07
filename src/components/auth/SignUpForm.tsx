import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSignUp } from "@clerk/nextjs";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";

interface RouterQuery {
  from: string;
}

interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

type OauthStrategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

interface Props {
  callback: string;
  showSsoForm: boolean;
  setShowSsoForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const SignUpFrom = ({ callback, setShowSsoForm }: Props) => {
  const [showPassword, _setShowPassword] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStrategy, setIsLoadingStrategy] = useState<
    null | OauthStrategy | "password"
  >(null);

  const { handleSubmit, register, control /* formState */ } =
    useForm<SignUpInput>();

  const router = useRouter();

  const { from } = router.query as unknown as RouterQuery;

  // const {email: emailError, password: passwordError} = formState.errors;
  const values = useWatch<SignUpInput>({ control });

  const { signUp, setActive } = useSignUp();

  const submit: SubmitHandler<SignUpInput> = async (values) => {
    if (isLoading || !signUp) return;

    setIsLoading(true);
    try {
      const res = await signUp
        .create({
          emailAddress: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
        })
        .catch((e) => {
          console.error("SignUp create error: ", { e });
          setError((e.errors[0]?.longMessage as string) || null);
          setIsLoading(false);
        });

      if (!res) return;

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        await router.push(callback);
      } else {
        const prepRes = await signUp
          .prepareEmailAddressVerification({
            strategy: "email_code",
          })
          .catch((e) => {
            console.error("SignUp prepareEmailAddressVerification error: ", {
              e,
            });
            setError((e.errors[0]?.longMessage as string) || null);
          });

        if (prepRes) {
          setShowSsoForm(true);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    }

    setIsLoading(false);
  };

  const signUpWith = (strategy: OauthStrategy) => async () => {
    setIsLoading(true);
    setIsLoadingStrategy(strategy);

    await signUp
      ?.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: callback,
      })
      .catch((e) => {
        console.error(e);
        setError((e.errors[0]?.longMessage as string) || null);
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingStrategy(null);
      });
  };

  useEffect(() => {
    setError(null);
  }, [values]);

  return (
    <>
      {<p>Sign up</p>}
      <div>
        <button disabled={isLoading} onClick={signUpWith("oauth_google")}>
          {loadingStrategy === "oauth_google" ? "Loading..." : "Google"}
        </button>
        <button disabled={isLoading} onClick={signUpWith("oauth_facebook")}>
          {loadingStrategy === "oauth_facebook" ? "Loading..." : "Facebook"}
        </button>
        <button disabled={isLoading} onClick={signUpWith("oauth_apple")}>
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

        <div>
          <input
            {...register("firstName", {
              required: true,
              minLength: 2,
            })}
            type="text"
            placeholder="First Name"
          />

          <input
            {...register("lastName", {
              required: true,
              minLength: 2,
            })}
            type="text"
            placeholder="Last Name"
          />
        </div>

        <input
          {...register("password", { required: true })}
          type={showPassword ? "text" : "password"}
          placeholder="Enter Password"
        />

        {error != null && <p>{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Sign Up"}
        </button>
      </form>
    </>
  );
};

export default SignUpFrom;
