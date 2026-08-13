import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import SignUp from "@/files/auth/screens/SignUp";

const SignUpRoute = () => {
  useDocumentTitle("Sign up | Paracomm");
  return <SignUp />;
};

export default SignUpRoute;
