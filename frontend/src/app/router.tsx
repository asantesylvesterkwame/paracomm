import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import HomeRoute from "@/app/routes/HomeRoute";
import LiveRoute from "@/app/routes/LiveRoute";
import StylesRoute from "@/app/routes/StylesRoute";
import NotFoundRoute from "@/app/routes/NotFoundRoute";
import { ROUTES } from "@/constants/routes.constants";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomeRoute /> },
      { path: ROUTES.LIVE, element: <LiveRoute /> },
      { path: ROUTES.STYLES, element: <StylesRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);
