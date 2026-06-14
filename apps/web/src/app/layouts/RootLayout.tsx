import { Outlet } from "react-router";
import { LgpdModal } from "../components/LgpdModal";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider } from "../theme/ThemeContext";

export function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
        <LgpdModal />
      </AuthProvider>
    </ThemeProvider>
  );
}
