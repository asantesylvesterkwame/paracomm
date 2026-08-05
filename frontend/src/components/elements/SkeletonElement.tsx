import { Skeleton } from "@/components/ui/skeleton";
import type { SkeletonElementProps } from "@/interfaces/components/elements/skeletonElement.interface";

const SkeletonElement = ({ className }: SkeletonElementProps) => {
  return <Skeleton className={className} />;
};

export default SkeletonElement;
