import Landing from "@/files/home/screens/Landing";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const HomeRoute = () => {
  useDocumentTitle("Paracomm | Realtime speech translation");
  return <Landing />;
};

export default HomeRoute;
