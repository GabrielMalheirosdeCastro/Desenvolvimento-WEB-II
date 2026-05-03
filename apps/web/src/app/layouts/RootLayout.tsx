import { Outlet } from "react-router";
import { LgpdModal } from "../components/LgpdModal";

export function RootLayout() {
  return (
    <>
      <Outlet />
      <LgpdModal />
    </>
  );
}
