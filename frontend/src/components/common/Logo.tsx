import { Link } from "react-router-dom";
import { Languages } from "lucide-react";

const Logo = () => {
  return (
    <Link to="/" className="flex flex-row cursor-pointer gap-2 items-center">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Languages className="size-4" strokeWidth={2.4} />
      </span>
      <h1 className="text-headline text-lg">Paracomm</h1>
    </Link>
  );
};

export default Logo;
