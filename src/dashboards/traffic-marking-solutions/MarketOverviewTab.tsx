/**
 * Market Overview Tab — Traffic Marking Solutions Market.
 */

import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { KPICard } from "./ui-helpers";
import { MarketOverviewChart, DistributionDonutsRow, DrillDownModal, SegmentPieChart } from "./charts";
import { MarketData, calculateCAGR, SegmentData, YearlyData, useDrillDown } from "./data";
import { config, TabType } from "./config";

interface MarketOverviewTabProps {
  marketData: MarketData;
  selectedYear: number;
  onNavigateToTab: (tabType: TabType) => void;
}

export function MarketOverviewTab({ marketData, selectedYear, onNavigateToTab }: MarketOverviewTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { useMillions, labels } = config;

  const lastYear = marketData.years[marketData.years.length - 1];
  const currentRunningYear = new Date().getFullYear() - 1;
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const currentMarketValue = marketData.totalMarket.find((d) => d.year === selectedYear)?.value ?? 0;
  const valueFirst = marketData.totalMarket.find((d) => d.year === cagrStartYear)?.value ?? 0;
  const valueLast = marketData.totalMarket.find((d) => d.year === lastYear)?.value ?? 0;
  const cagrValue = calculateCAGR(valueFirst, valueLast, lastYear - cagrStartYear);

  // Leading product / region (in selected year)
  const findLeader = (segs: SegmentData[]): { name: string; share: number } => {
    const total = segs.reduce((s, seg) => s + (seg.data.find(d => d.year === selectedYear)?.value ?? 0), 0);
    if (!segs.length || total === 0) return { name: "—", share: 0 };
    const sorted = [...segs].sort((a, b) =>
      (b.data.find(d => d.year === selectedYear)?.value ?? 0) - (a.data.find(d => d.year === selectedYear)?.value ?? 0));
    const top = sorted[0];
    const topVal = top.data.find(d => d.year === selectedYear)?.value ?? 0;
    return { name: top.name, share: total > 0 ? (topVal / total) * 100 : 0 };
  };
  const leadingProduct = findLeader(marketData.productType);
  const leadingRegion = findLeader(marketData.region);

  const handleSliceClick = (segmentName: string, segmentData: YearlyData[], color: string, donutType: TabType) => {
    let relatedSegments: { title: string; data: SegmentData[] } | undefined;
    switch (donutType) {
      case "productType":  relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "application":  relatedSegments = { title: "By Region", data: marketData.region }; break;
      case "region":       relatedSegments = { title: `By ${labels.productType}`, data: marketData.productType }; break;
    }
    openDrillDown(segmentName, segmentData, color, relatedSegments);
  };

  // Company share donut data adapted to SegmentData (single-year)
  const companyShareAsSegments: SegmentData[] = marketData.companyShare.map(c => ({
    name: c.name,
    data: [{ year: marketData.companyShareYear, value: c.share }],
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard title={`${selectedYear} Market Size`} value={useMillions ? currentMarketValue : currentMarketValue / 1000} suffix={useMillions ? "M" : "B"} icon={DollarSign} delay={0} accentColor="primary" />
        <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagrValue} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
        <KPICard title={`${lastYear} Forecast`} value={useMillions ? valueLast : valueLast / 1000} suffix={useMillions ? "M" : "B"} icon={TrendingUp} delay={0.2} accentColor="accent" />
      </div>


      <MarketOverviewChart
        data={marketData.totalMarket}
        title="Market Size & YoY Growth Trend"
        subtitle={`${marketData.years[0]}-${lastYear} data`}
        useMillions={useMillions}
      />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{selectedYear} Market Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Click any slice to see detailed analysis</p>
        <DistributionDonutsRow
          entries={[
            { data: marketData.productType, title: labels.productType, tabType: "productType" },
            { data: marketData.application, title: labels.application, tabType: "application" },
            { data: marketData.region,      title: labels.region,      tabType: "region" },
            { data: companyShareAsSegments, title: `Company Share (${marketData.companyShareYear})`, tabType: "company", yearOverride: marketData.companyShareYear },
          ]}
          year={selectedYear}
          onDonutClick={onNavigateToTab}
          onSliceClick={(name, data, color, t) => t === "company"
            ? onNavigateToTab("company")
            : handleSliceClick(name, data, color, t)}
        />
      </div>

      <DrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={closeDrillDown}
        segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData}
        color={drillDownState.color}
        useMillions={useMillions}
      />
    </div>
  );
}
