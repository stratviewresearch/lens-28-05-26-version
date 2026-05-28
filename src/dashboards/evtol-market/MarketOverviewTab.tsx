/**
 * Market Overview Tab — self-contained for this dashboard.
 * Reads labels and display rules from config.ts.
 */

import { DollarSign, TrendingUp, BarChart3, Hash } from "lucide-react";
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
  const isUnits = unitMode === "units";
  const useMillions = !isUnits; // value mode uses millions
  const unitSuffix = isUnits ? "" : "M";
  const unitLabel = isUnits ? "Units" : "US$ Million";

  const lastYear = marketData.years[marketData.years.length - 1];
  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const currentMarketValue = marketData.totalMarket.find((d) => d.year === selectedYear)?.value ?? 0;
  const valueFirst = marketData.totalMarket.find((d) => d.year === cagrStartYear)?.value ?? 0;
  const valueLast = marketData.totalMarket.find((d) => d.year === lastYear)?.value ?? 0;
  const cagrValue = calculateCAGR(valueFirst, valueLast, lastYear - cagrStartYear);

  const formatValue = (v: number) => isUnits ? v : v; // Already in correct unit from data

  const handleSliceClick = (segmentName: string, segmentData: YearlyData[], color: string, donutType: TabType) => {
    let relatedSegments: { title: string; data: SegmentData[] } | undefined;
    switch (donutType) {
      case "endUser": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "region": relatedSegments = { title: `By ${labels.endUser}`, data: marketData.endUser }; break;
      case "application": relatedSegments = { title: `By ${labels.endUser}`, data: marketData.endUser }; break;
      case "equipment": relatedSegments = { title: `By ${labels.endUser}`, data: marketData.endUser }; break;
    }
    openDrillDown(segmentName, segmentData, color, relatedSegments);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title={`${selectedYear} Market Size`}
          value={isUnits ? currentMarketValue : (useMillions ? currentMarketValue : currentMarketValue / 1000)}
          suffix={isUnits ? " Units" : (useMillions ? "M" : "B")}
          prefix={isUnits ? "" : "$"}
          decimals={isUnits ? 0 : 1}
          icon={isUnits ? Hash : DollarSign}
          delay={0}
          accentColor="primary"
        />
        <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagrValue} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
        <KPICard
          title={`${lastYear} Forecast`}
          value={isUnits ? valueLast : (useMillions ? valueLast : valueLast / 1000)}
          suffix={isUnits ? " Units" : (useMillions ? "M" : "B")}
          prefix={isUnits ? "" : "$"}
          decimals={isUnits ? 0 : 1}
          icon={TrendingUp}
          delay={0.2}
          accentColor="accent"
        />
      </div>

      <MarketOverviewChart
        data={marketData.totalMarket}
        title={`Market Size & YoY Growth Trend (${unitLabel})`}
        subtitle={`${marketData.years[0]}-${lastYear} data`}
        useMillions={useMillions}
        isUnits={isUnits}
      />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">{selectedYear} Market Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Click any slice to see detailed analysis</p>
        <DistributionDonutsRow
          endUserData={marketData.endUser}
          aircraftData={[]}
          regionData={marketData.region}
          applicationData={marketData.application}
          equipmentData={marketData.furnishedEquipment?.length ? marketData.furnishedEquipment : (marketData.materialType ?? [])}
          processTypeData={marketData.processType}
          year={selectedYear}
          onDonutClick={onNavigateToTab}
          onSliceClick={handleSliceClick}
          endUserLabel={labels.endUser}
          equipmentLabel={labels.equipment}
          processTypeLabel={labels.processType}
          applicationLabel={labels.application}
        />
      </div>

      <DrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={closeDrillDown}
        segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData}
        color={drillDownState.color}
        useMillions={useMillions}
        isUnits={isUnits}
      />
    </div>
  );
}
