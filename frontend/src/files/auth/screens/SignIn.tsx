import { SignIn as ClerkSignIn } from "@clerk/react";
import { motion } from "motion/react";
import { fadeScale, SPRING } from "@/lib/motion";
import { isClerkConfigured } from "@/providers/clerk-provider";
import { ROUTES } from "@/constants/routes.constants";
import ClerkNotConfigured from "../components/ClerkNotConfigured";

const SignIn = () => (
  <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
    <motion.div
      variants={fadeScale}
      initial="hidden"
      animate="show"
      transition={SPRING.panel}
      className="flex w-full justify-center"
    >
      {isClerkConfigured ? (
        <ClerkSignIn
          routing="path"
          path={ROUTES.SIGN_IN}
          signUpUrl={ROUTES.SIGN_UP}
          fallbackRedirectUrl={ROUTES.CHAT}
        />
      ) : (
        <ClerkNotConfigured />
      )}
    </motion.div>
  </div>
);

export default SignIn;
