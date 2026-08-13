import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import SignIn from "@/files/auth/screens/SignIn";

const SignInRoute = () => {
  useDocumentTitle("Sign in | Paracomm");
  return <SignIn />;
};

export default SignInRoute;
