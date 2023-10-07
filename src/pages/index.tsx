import Link from "next/link";

const Page = () => {
  return (
    <div>
      <h3>This is the index page</h3>
      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/sign-in">Sign In (no callback)</Link>
        <Link href="/sign-in?callback=/dashboard">
          Sign In (callback to /dashboard)
        </Link>
        <Link href="/sign-up">Sign Up (no callback)</Link>
        <Link href="/sign-up?callback=/dashboard">
          Sign Up (callback to /dashboard)
        </Link>
      </div>
    </div>
  );
};

export default Page;
