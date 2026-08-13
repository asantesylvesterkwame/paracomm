import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Chat from "@/files/room/screens/Chat";

const ChatRoute = () => {
  useDocumentTitle("Chat | Paracomm");
  return <Chat />;
};

export default ChatRoute;
