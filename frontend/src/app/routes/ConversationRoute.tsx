import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Conversation from "@/files/message/screens/Conversation";

const ConversationRoute = () => {
  useDocumentTitle("Conversation | Paracomm");
  return <Conversation />;
};

export default ConversationRoute;
