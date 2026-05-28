import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  pdfUrl: string;
  dashboardSlug: string;
  title?: string;
  className?: string;
}

export const ViewFullReportButton = ({ pdfUrl, dashboardSlug, title, className }: Props) => {
  const handleClick = () => {
    const params = new URLSearchParams({
      src: pdfUrl,
      dashboardSlug,
      ...(title ? { title } : {}),
    });
    window.open(`/viewer/pdf?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Button variant="default" onClick={handleClick} className={className}>
      <FileText className="mr-2 h-4 w-4" />
      View Full Report
    </Button>
  );
};

export default ViewFullReportButton;