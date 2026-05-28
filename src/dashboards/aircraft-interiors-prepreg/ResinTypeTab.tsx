/**
 * Resin Type Tab — Aircraft Interiors Prepreg.
 * Faithful to the source Excel "By Resin Type" header which contains three
 * sub-bifurcations (Chemistry, Fiber, Form) of the same Thermoset/Thermoplastic split.
 *
 * Layout:
 *   1. Parent (Thermoset vs Thermoplastic): historical trend + selected-year pie.
 *   2. Three stacked bar charts (selected year): Chemistry, Fiber, Form sub-breakdowns.
 *   3. One growth-analysis table for the parent split.
 */

import {
  MarketTrendChart,
  SegmentPieChart,
  StackedBarChart,
  ComparisonTable,
  DrillDownModal,
  CHART_COLORS,
} from "./charts";
import { MarketData, YearlyData, SegmentData, useDrillDown } from "./data";
import { UnitMode } from "./config";

interface ResinTypeTabProps {
  marketData: MarketData;
  totalMarket: YearlyData[];
  selectedYear: number;
  unitMode: UnitMode;
}

export function ResinTypeTab({ marketData, totalMarket, selectedYear, unitMode }: ResinTypeTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const isVolume = unitMode === "volume";
  const useMillions = true;

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear)
    ? currentRunningYear
    : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const parents = marketData.materialType; // Thermoset, Thermoplastic

  const buildCrossTab = (crossTabMap: Record<string, SegmentData[]> | undefined) => {
    if (!crossTabMap || Object.keys(crossTabMap).length === 0) return [];
    return parents
      .map((parent) => {
        const children = crossTabMap[parent.name] || [];
        const segments = children.map((child) => ({
          name: child.name,
          value: child.data.find((d) => d.year === selectedYear)?.value ?? 0,
          fullData: child.data,
        }));
        return {
          name: parent.name,
          segments,
          total: segments.reduce((s, seg) => s + seg.value, 0),
        };
      })
      .filter((row) => row.segments.length > 0);
  };

  const chemistryData = buildCrossTab(marketData.materialTypeByRegion);

  const subNames = (rows: ReturnType<typeof buildCrossTab>) => {
    const names = new Set<string>();
    rows.forEach((r) => r.segments.forEach((s) => names.add(s.name)));
    return Array.from(names);
  };

  const handleSegmentClick = (name: string, data: YearlyData[], color: string) =>
    openDrillDown(name, data, color, undefined);

  const handleStackedClick = (
    parentName: string,
    segmentName: string,
    _value: number,
    color: string,
    fullData?: YearlyData[],
  ) => {
    if (fullData) openDrillDown(`${segmentName} (${parentName})`, fullData, color, undefined);
  };

  return (
    <div className="space-y-8">
      {parents.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart
              data={totalMarket}
              segments={parents}
              title="By Resin Type - Market Trend"
              subtitle="Historical and forecast data - Click legend to drill down"
              showSegments
              onSegmentClick={handleSegmentClick}
              useMillions={useMillions}
              isVolume={isVolume}
            />
          </div>
          <SegmentPieChart
            data={parents}
            year={selectedYear}
            title="By Resin Type"
            onSegmentClick={handleSegmentClick}
            isVolume={isVolume}
          />
        </div>
      )}

      {chemistryData.length > 0 && chemistryData.some((d) => d.total > 0) && (
        <StackedBarChart
          data={chemistryData}
          year={selectedYear}
          title="Resin Type by Chemistry"
          subtitle={`${selectedYear} chemistry breakdown by resin type`}
          segmentColors={CHART_COLORS}
          segmentNames={subNames(chemistryData)}
          onSegmentClick={handleStackedClick}
          useMillions={useMillions}
          isVolume={isVolume}
        />
      )}


      {parents.length > 0 && (
        <ComparisonTable
          data={parents}
          startYear={cagrStartYear}
          endYear={lastYear}
          title="By Resin Type - Growth Analysis"
          onRowClick={handleSegmentClick}
          isVolume={isVolume}
        />
      )}

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
