import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { fadeScale, SPRING } from "@/lib/motion";
import { ROUTES } from "@/constants/routes.constants";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const NotFoundRoute = () => {
  useDocumentTitle("Page not found | Paracomm");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <motion.div
        variants={fadeScale}
        initial="hidden"
        animate="show"
        transition={SPRING.panel}
        className="flex flex-col items-center gap-4 text-center"
      >
        <p className="text-eyebrow">404</p>
        <h1 className="text-headline text-3xl">This page does not exist</h1>
        <Link
          to={ROUTES.HOME}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundRoute;
