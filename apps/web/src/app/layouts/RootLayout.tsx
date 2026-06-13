import { Outlet } from "react-router";
import { LgpdModal } from "../components/LgpdModal";
import { AuthProvider } from "../auth/AuthContext";

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <LgpdModal />
    </AuthProvider>
  );
}
