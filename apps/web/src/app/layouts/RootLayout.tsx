import { Outlet } from "react-router";
import { LgpdModal } from "../components/LgpdModal";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider } from "../theme/ThemeContext";
import { LanguageProvider } from "../i18n/LanguageContext";

export function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <LgpdModal />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
