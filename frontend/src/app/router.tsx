import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import HomeRoute from "@/app/routes/HomeRoute";
import LiveRoute from "@/app/routes/LiveRoute";
import StylesRoute from "@/app/routes/StylesRoute";
import NotFoundRoute from "@/app/routes/NotFoundRoute";
import SignInRoute from "@/app/routes/SignInRoute";
import SignUpRoute from "@/app/routes/SignUpRoute";
import { ROUTES } from "@/constants/routes.constants";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomeRoute /> },
      { path: ROUTES.LIVE, element: <LiveRoute /> },
      { path: `${ROUTES.SIGN_IN}/*`, element: <SignInRoute /> },
      { path: `${ROUTES.SIGN_UP}/*`, element: <SignUpRoute /> },
      { path: ROUTES.STYLES, element: <StylesRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);
