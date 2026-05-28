import { lazy, Suspense } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { MoreHorizontal } from "lucide-react";

interface DynamicIconProps {
  name: string | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

const DynamicIcon = ({ name, className, fallback }: DynamicIconProps) => {
  // Normalize the name to kebab-case
  const kebabName = (name?.toLowerCase().replace(/\s+/g, '-') || "more-horizontal") as keyof typeof dynamicIconImports;

  if (!dynamicIconImports[kebabName]) {
    // Return the provided fallback or the default MoreHorizontal icon
    return fallback ? (
      <>{fallback}</>
    ) : (
      <MoreHorizontal className={className} />
    );
  }

  const LucideIcon = lazy(dynamicIconImports[kebabName]);

  return (
    <Suspense fallback={fallback || <div className={`${className} bg-muted rounded animate-pulse`} />}>
      <LucideIcon className={className} />
    </Suspense>
  );
};

export default DynamicIcon;
