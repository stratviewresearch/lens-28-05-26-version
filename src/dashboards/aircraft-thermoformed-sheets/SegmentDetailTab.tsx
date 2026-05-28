/**
 * Segment Detail Tab — self-contained for Aircraft Thermoformed Sheets dashboard.
 * No cross-tabulations in this dataset — just flat segments with trend + pie + comparison.
 */

import { MarketTrendChart, SegmentPieChart, ComparisonTable, DrillDownModal, CHART_COLORS } from "./charts";
import { YearlyData, SegmentData, MarketData, useDrillDown } from "./data";
import { config, TabType } from "./config";

interface SegmentDetailTabProps {
  segmentType: TabType;
  segmentData: SegmentData[];
  totalMarket: YearlyData[];
  marketData: MarketData;
  title: string;
  selectedYear: number;
}

export function SegmentDetailTab({ segmentType, segmentData, totalMarket, marketData, title, selectedYear }: SegmentDetailTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { useMillions } = config;

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);

  return (
    <div className="space-y-8">
      {segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart data={totalMarket} segments={segmentData} title={`${title} - Market Trend`}
              subtitle="Historical and forecast data (US$ Millions) - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} />
          </div>
          <SegmentPieChart data={segmentData} year={selectedYear} title={title} onSegmentClick={handlePieSegmentClick} />
        </div>
      )}

      <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} — Comparison`} onRowClick={handleTableRowClick} />

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName} segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} />
    </div>
  );
}
