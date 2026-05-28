/**
 * Main Dashboard Page — self-contained.
 * All behavior is driven by config.ts. No shared component imports.
 */

import { useState } from "react";
import "./theme.css";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppFooter from "@/components/AppFooter";

import { config, TabType, UnitMode } from "./config";
import { useMarketData } from "./data";
import { DashboardHeader, DashboardSkeleton, ScrollToTop, MainNavigation, UnitToggle } from "./layout";
import { MarketOverviewTab } from "./MarketOverviewTab";
import { SegmentDetailTab } from "./SegmentDetailTab";

const HighTemperaturePrepregDashboard = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(config.defaultYear);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [unitMode, setUnitMode] = useState<UnitMode>("value");
  const { data: dualData, isLoading, error, refetch } = useMarketData(config.dataUrl);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !dualData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Failed to Load Data</h1>
        <p className="text-muted-foreground">{error || "Unable to load market data"}</p>
        <Button onClick={refetch} className="mt-4"><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
      </div>
    );
  }

  const marketData = dualData[unitMode];
  const unitConfig = config.unitModes[unitMode];

  const getSegmentInfo = () => {
    const mapping = config.segmentMapping[activeTab];
    if (!mapping) return { data: marketData.endUser, title: "End Use Industry" };
    const dataKey = mapping.dataKey as keyof typeof marketData;
    return { data: (marketData[dataKey] as any) || [], title: mapping.title };
  };

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return <MarketOverviewTab marketData={marketData} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigateToTab={setActiveTab} unitMode={unitMode} />;
    }
    const segmentInfo = getSegmentInfo();
    return (
      <SegmentDetailTab
        segmentType={activeTab}
        segmentData={segmentInfo.data}
        totalMarket={marketData.totalMarket}
        marketData={marketData}
        title={segmentInfo.title}
        selectedYear={selectedYear}
        unitMode={unitMode}
      />
    );
  };

  return (
    <div className="composites-carbon-theme min-h-screen">
      <ScrollToTop />
      <DashboardHeader title={config.title} subtitle={config.subtitle} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(config.backPath)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> {config.backLabel}
          </Button>
          <UnitToggle value={unitMode} onChange={setUnitMode} />
        </div>

        <div className="mb-8">
          <MainNavigation value={activeTab} onChange={setActiveTab} selectedYear={selectedYear} onYearChange={setSelectedYear} showYearSelector tabs={config.tabs} years={marketData.years} />
        </div>

        {renderTabContent()}

        <AppFooter variant="dark" sourceText={config.footerText} unitText={unitConfig.footerUnit} />
      </main>
    </div>
  );
};

export default HighTemperaturePrepregDashboard;
