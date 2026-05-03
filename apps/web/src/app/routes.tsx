import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
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
      { index: true, Component: LoginPage },
      {
        path: "dashboard",
        Component: DashboardLayout,
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
