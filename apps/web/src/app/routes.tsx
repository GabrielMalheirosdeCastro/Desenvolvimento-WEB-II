import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { AtivarPage } from "./pages/AtivarPage";
import { DashboardHome } from "./pages/DashboardHome";
import { StudyPlanPage } from "./pages/StudyPlanPage";
import { ConcentrationPage } from "./pages/ConcentrationPage";
import { MentorshipPage } from "./pages/MentorshipPage";
import { ForumPage } from "./pages/ForumPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      // Fase 4 (Bloco A / A5): a rota raiz passa a exigir login. Sem sessao
      // valida o ProtectedRoute redireciona /dashboard -> /login.
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", Component: LoginPage },
      { path: "ativar", Component: AtivarPage },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, Component: DashboardHome },
          { path: "plano-estudos", Component: StudyPlanPage },
          { path: "concentracao", Component: ConcentrationPage },
          { path: "mentoria", Component: MentorshipPage },
          { path: "forum", Component: ForumPage },
          { path: "biblioteca", Component: LibraryPage },
          { path: "perfil", Component: ProfilePage },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

