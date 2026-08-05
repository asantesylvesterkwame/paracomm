import Live from "@/files/live/screens/Live";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const LiveRoute = () => {
  useDocumentTitle("Live Translate | Paracomm");
  return <Live />;
};

export default LiveRoute;
