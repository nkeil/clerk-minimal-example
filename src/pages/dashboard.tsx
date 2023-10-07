import { SignOutButton } from "@clerk/nextjs";

const Dashboard = () => {
  return (
    <div>
      <div>
        This is the dashboard page. It is only accessible to signed-in users.
      </div>
      <SignOutButton />
    </div>
  );
};

export default Dashboard;
