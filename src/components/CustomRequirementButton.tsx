import { useState } from "react";
import { Button } from "@/components/ui/button";
import AccessRequestDialog from "./AccessRequestDialog";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomRequirementButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

const CustomRequirementButton = ({ className, variant }: CustomRequirementButtonProps) => {
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        className={cn(
          "hidden lg:flex items-center gap-2 px-6 py-2.5 btn-premium-pattern rounded-full border-none shadow-xl group animate-pulse-glow",
          className
        )}
        onClick={() => setIsAccessDialogOpen(true)}
        onMouseMove={handleMouseMove}
      >
        {/* Shimmer Sweep */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none z-20" />
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-glow-blink" />
          <span>Got a Custom Requirement?</span>
        </div>
      </Button>

      <AccessRequestDialog 
        open={isAccessDialogOpen} 
        onOpenChange={setIsAccessDialogOpen} 
        datasetName="Custom Requirement" 
        dashboardSlug="custom-requirement"
      />
    </>
  );
};

export default CustomRequirementButton;
