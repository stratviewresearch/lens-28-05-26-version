/**
 * Market Overview Tab — self-contained for Aircraft Soft Goods dashboard.
 */

import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { KPICard } from "./ui-helpers";
import { MarketOverviewChart, DistributionDonutsRow, DrillDownModal } from "./charts";
import { MarketData, calculateCAGR, SegmentData, YearlyData, useDrillDown } from "./data";
import { config, TabType } from "./config";

interface MarketOverviewTabProps {
  marketData: MarketData;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onNavigateToTab: (tabType: TabType) => void;
}

export function MarketOverviewTab({ marketData, selectedYear, onNavigateToTab }: MarketOverviewTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { useMillions } = config;

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
      case "aircraft": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "region": relatedSegments = { title: "By Aircraft Type", data: marketData.aircraftType }; break;
      case "productType": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "materialType": relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "endUser": relatedSegments = { title: "By Region", data: marketData.region }; break;
    }
    openDrillDown(segmentName, segmentData, color, relatedSegments);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title={`${selectedYear} Market Size`} value={useMillions ? currentMarketValue : currentMarketValue / 1000} suffix={useMillions ? "M" : "B"} icon={DollarSign} delay={0} accentColor="primary" />
        <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagrValue} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
        <KPICard title={`${lastYear} Forecast`} value={useMillions ? valueLast : valueLast / 1000} suffix={useMillions ? "M" : "B"} icon={TrendingUp} delay={0.2} accentColor="accent" />
      </div>

      <MarketOverviewChart data={marketData.totalMarket} title="Market Size & YoY Growth Trend" subtitle={`${marketData.years[0]}-${lastYear} data`} useMillions={useMillions} />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">{selectedYear} Market Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Click any slice to see detailed analysis</p>
        <DistributionDonutsRow
          aircraftData={marketData.aircraftType}
          regionData={marketData.region}
          productTypeData={marketData.productType}
          materialTypeData={marketData.materialType}
          endUserData={marketData.endUser}
          year={selectedYear}
          onDonutClick={onNavigateToTab}
          onSliceClick={handleSliceClick}
        />
      </div>

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName} segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} />
    </div>
  );
}
