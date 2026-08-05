import StylesPage from "@/components/styles/StylesPage";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const StylesRoute = () => {
  useDocumentTitle("Design system | Paracomm");
  return <StylesPage />;
};

export default StylesRoute;
