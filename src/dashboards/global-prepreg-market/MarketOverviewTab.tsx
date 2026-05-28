/**
 * Market Overview Tab — Global Prepreg Market dashboard.
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
  const isVolume = unitMode === "volume";
  const useMillions = true;

  const lastYear = marketData.years[marketData.years.length - 1];
  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const currentMarketValue = marketData.totalMarket.find((d) => d.year === selectedYear)?.value ?? 0;
  const valueFirst = marketData.totalMarket.find((d) => d.year === cagrStartYear)?.value ?? 0;
  const valueLast = marketData.totalMarket.find((d) => d.year === lastYear)?.value ?? 0;
  const cagrValue = calculateCAGR(valueFirst, valueLast, lastYear - cagrStartYear);

  const handleSliceClick = (segmentName: string, segmentData: YearlyData[], color: string, _donutType: TabType) => {
    openDrillDown(segmentName, segmentData, color, undefined);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title={`${selectedYear} Market Size`} value={currentMarketValue} prefix={isVolume ? "" : "$"} suffix={isVolume ? " M Lbs" : "M"} icon={isVolume ? Weight : DollarSign} delay={0} accentColor="primary" />
        <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagrValue} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
        <KPICard title={`${lastYear} Forecast`} value={valueLast} prefix={isVolume ? "" : "$"} suffix={isVolume ? " M Lbs" : "M"} icon={TrendingUp} delay={0.2} accentColor="accent" />
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
          endUseData={marketData.endUser}
          regionData={marketData.region}
          fiberTypeData={marketData.furnishedEquipment}
          resinTypeData={marketData.materialType}
          formTypeData={marketData.application}
          processTypeData={marketData.processType}
          year={selectedYear}
          onDonutClick={onNavigateToTab}
          onSliceClick={handleSliceClick}
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
