import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/DashboardHeader";
import AppFooter from "@/components/AppFooter";

const disclaimerPoints = [
  "Stratview Research, along with its employees, publishers, authors, and partners takes utmost care to ensure that the information, content, graphics, or any other data provided in our reports is of high accuracy.",
  "The information contained in the Stratview Research's reports is based on the interviews, third party opinions and judgments and therefore, is subject to fluctuation.",
  "Hence, Stratview Research does not guarantee for 100% authenticity of the information (expressed or implied) provided in any of the reports, articles, or documents.",
  "Stratview Research's analysis and reports are intended for the internal use of our customers and are not meant for general publication or disclosure to third parties.",
  "No part of our reports, articles, or documents can be resold, or distributed in any form, electronic or otherwise or be given to third party without prior written permission of Stratview Research.",
  "No part of our reports, dashboards or documents can be copied or reproduced without the written permission of Stratview Research.",
  "Stratview Research takes no responsibility for strategies or decisions made on the basis of information in our report, dashboards or any other document.",
  "Stratview Research does not take responsibility for any kind of loss or damage incurred due to the use of information contained in its reports, articles, or any other document.",
];

const Disclaimer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-10 md:py-14 px-4 md:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="container relative z-10 px-0">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground font-display">
            Disclaimer
          </h1>
          <p className="mt-2 text-primary-foreground/70 text-sm md:text-base max-w-2xl">
            Important information regarding the use of our reports, dashboards, and documents
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="container px-4 md:px-6 py-8 md:py-12 max-w-3xl">
        <div className="space-y-4">
          {disclaimerPoints.map((point, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 rounded-lg bg-muted/30 border border-border/50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default Disclaimer;
