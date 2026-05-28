/**
 * Market Overview Tab — Aircraft Interiors Prepreg dashboard.
 */

import { DollarSign, TrendingUp, BarChart3, Weight } from "lucide-react";
import { KPICard } from "./ui-helpers";
import { MarketOverviewChart, DistributionDonutsRow, DrillDownModal } from "./charts";
import { MarketData, calculateCAGR, SegmentData, YearlyData, useDrillDown } from "./data";
import { config, TabType, UnitMode } from "./config";

interface MarketOverviewTabProps {
  marketData: MarketData;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onNavigateToTab: (tabType: TabType) => void;
  unitMode: UnitMode;
}

export function MarketOverviewTab({ marketData, selectedYear, onNavigateToTab, unitMode }: MarketOverviewTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { labels } = config;
  const isVolume = unitMode === "volume";
  const useMillions = true;

  const lastYear = marketData.years[marketData.years.length - 1];
  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const currentMarketValue = marketData.totalMarket.find((d) => d.year === selectedYear)?.value ?? 0;
  const valueFirst = marketData.totalMarket.find((d) => d.year === cagrStartYear)?.value ?? 0;
  const valueLast = marketData.totalMarket.find((d) => d.year === lastYear)?.value ?? 0;
  const cagrValue = calculateCAGR(valueFirst, valueLast, lastYear - cagrStartYear);

  const handleSliceClick = (segmentName: string, segmentData: YearlyData[], color: string, donutType: TabType) => {
    let relatedSegments: { title: string; data: SegmentData[] } | undefined;
    switch (donutType) {
      case "region": relatedSegments = { title: `By ${labels.fiberType}`, data: marketData.furnishedEquipment }; break;
      case "fiberType": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "resinType": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "formType": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "panelType": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "oem": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "salesChannel": relatedSegments = { title: "By Region", data: marketData.region }; break;
    }
    openDrillDown(segmentName, segmentData, color, relatedSegments);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title={`${selectedYear} Market Size`} value={currentMarketValue} prefix={isVolume ? "" : "$"} suffix={isVolume ? "M Lbs" : "M"} icon={isVolume ? Weight : DollarSign} delay={0} accentColor="primary" />
        <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagrValue} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
        <KPICard title={`${lastYear} Forecast`} value={valueLast} prefix={isVolume ? "" : "$"} suffix={isVolume ? "M Lbs" : "M"} icon={TrendingUp} delay={0.2} accentColor="accent" />
      </div>

      <MarketOverviewChart
        data={marketData.totalMarket}
        title="Market Size & YoY Growth Trend"
        subtitle={`${marketData.years[0]}-${lastYear} data`}
        useMillions={useMillions}
        isVolume={isVolume}
      />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">{selectedYear} Market Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Click any slice to see detailed analysis</p>
        <DistributionDonutsRow
          panelTypeData={marketData.endUser}
          regionData={marketData.region}
          fiberTypeData={marketData.furnishedEquipment}
          resinTypeData={marketData.materialType}
          formTypeData={marketData.application}
          oemData={marketData.processType}
          salesChannelData={marketData.aircraftType}
          year={selectedYear}
          onDonutClick={onNavigateToTab}
          onSliceClick={handleSliceClick}
          panelTypeLabel={labels.panelType}
          fiberTypeLabel={labels.fiberType}
          resinTypeLabel={labels.resinType}
          formTypeLabel={labels.formType}
          oemLabel={labels.oem}
          salesChannelLabel={labels.salesChannel}
          isVolume={isVolume}
        />
      </div>

      <DrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={closeDrillDown}
        segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData}
        color={drillDownState.color}
        useMillions={useMillions}
        isVolume={isVolume}
      />
    </div>
  );
}
