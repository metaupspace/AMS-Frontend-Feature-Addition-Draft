import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type SuspenseBoundaryProps = {
  children: React.ReactNode;
};

const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({ children }) => {
  const renderFormSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          {renderFormSkeleton()}
        </div>
      }
    >
      {children}
    </Suspense>
  );
};

export default SuspenseBoundary;
