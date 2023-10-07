import React from "react";
import router from "next/router";

interface Props {
  handleLogoClick?: () => void;
}

const LogoControl = ({ handleLogoClick }: Props) => {
  const _handleLogoClick = async () => {
    if (handleLogoClick) {
      handleLogoClick();
      return;
    }

    await router.push("/");
  };

  return (
    <div>
      <button onClick={_handleLogoClick}>Home</button>
    </div>
  );
};

export default LogoControl;
