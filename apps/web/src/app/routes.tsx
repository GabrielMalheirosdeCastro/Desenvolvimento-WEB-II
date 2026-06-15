import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RoleRoute } from "./auth/RoleRoute";
// Entrada e paginas pequenas permanecem eager (sem flash no primeiro paint).
import { LoginPage } from "./pages/LoginPage";
import { AtivarPage } from "./pages/AtivarPage";
import { NotFound } from "./pages/NotFound";

// D5/RNF02 — code-splitting: as paginas internas do dashboard sao carregadas
// sob demanda (chunks separados), reduzindo o bundle inicial. O <Suspense> que
// captura o carregamento fica no DashboardLayout (em volta do <Outlet/>).
const DashboardHome = lazy(() =>
  import("./pages/DashboardHome").then((m) => ({ default: m.DashboardHome }))
);
const StudyPlanPage = lazy(() =>
  import("./pages/StudyPlanPage").then((m) => ({ default: m.StudyPlanPage }))
);
const WellbeingPage = lazy(() =>
  import("./pages/WellbeingPage").then((m) => ({ default: m.WellbeingPage }))
);
const ConcentrationPage = lazy(() =>
  import("./pages/ConcentrationPage").then((m) => ({ default: m.ConcentrationPage }))
);
const MentorshipPage = lazy(() =>
  import("./pages/MentorshipPage").then((m) => ({ default: m.MentorshipPage }))
);
const ForumPage = lazy(() =>
  import("./pages/ForumPage").then((m) => ({ default: m.ForumPage }))
);
const LibraryPage = lazy(() =>
  import("./pages/LibraryPage").then((m) => ({ default: m.LibraryPage }))
);
const EventsPage = lazy(() =>
  import("./pages/EventsPage").then((m) => ({ default: m.EventsPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const ChatbotPage = lazy(() =>
  import("./pages/ChatbotPage").then((m) => ({ default: m.ChatbotPage }))
);
const ChatNapPage = lazy(() =>
  import("./pages/ChatNapPage").then((m) => ({ default: m.ChatNapPage }))
);
const CoordenacaoPage = lazy(() =>
  import("./pages/CoordenacaoPage").then((m) => ({ default: m.CoordenacaoPage }))
);

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
          { path: "bem-estar", Component: WellbeingPage },
          { path: "concentracao", Component: ConcentrationPage },
          { path: "mentoria", Component: MentorshipPage },
          { path: "forum", Component: ForumPage },
          { path: "biblioteca", Component: LibraryPage },
          { path: "eventos", Component: EventsPage },
          { path: "chatbot", Component: ChatbotPage },
          { path: "chat-nap", Component: ChatNapPage },
          { path: "perfil", Component: ProfilePage },
          {
            path: "coordenacao",
            element: (
              <RoleRoute papeis={["COORDENADOR"]}>
                <CoordenacaoPage />
              </RoleRoute>
            ),
          },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

