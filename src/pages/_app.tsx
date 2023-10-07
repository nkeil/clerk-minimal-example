import type { AppProps, AppType } from "next/app";
import Head from "next/head";
import { ClerkProvider } from "@clerk/nextjs";

const MyApp: AppType = ({ Component, pageProps }: AppProps) => {
  return (
    <div>
      <Head>
        <title>Clerk minimal example</title>
      </Head>
      <ClerkProvider {...pageProps}>
        <Component {...pageProps} />
      </ClerkProvider>
    </div>
  );
};

export default MyApp;
