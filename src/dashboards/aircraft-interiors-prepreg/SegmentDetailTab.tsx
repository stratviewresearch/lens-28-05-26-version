/**
 * Segment Detail Tab — Aircraft Interiors Prepreg dashboard.
 * Cross-tabs:
 * - Panel Type: children per parent (Panels → Galley/Lavatory/etc, Non-Sandwich → ECS/Seats/etc)
 * - Resin Type: sub-resin per parent (Thermoset → Phenolic/Epoxy, Thermoplastic → PEI/Other)
 * - Fiber Type: fiber per resin parent
 * - Form Type: form per resin parent
 * - Region/OEM/Sales Channel: no cross-tabs
 */

import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { KPICard } from "./ui-helpers";
import { MarketTrendChart, SegmentPieChart, ComparisonTable, DrillDownModal, StackedBarChart, CHART_COLORS } from "./charts";
import { YearlyData, SegmentData, MarketData, calculateCAGR, useDrillDown } from "./data";
import { config, TabType, UnitMode } from "./config";

interface SegmentDetailTabProps {
  segmentType: TabType;
  segmentData: SegmentData[];
  totalMarket: YearlyData[];
  marketData: MarketData;
  title: string;
  selectedYear: number;
  unitMode: UnitMode;
}

export function SegmentDetailTab({ segmentType, segmentData, totalMarket, marketData, title, selectedYear, unitMode }: SegmentDetailTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { labels } = config;
  const isVolume = unitMode === "volume";
  const useMillions = true;

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  // ── Cross-tab data builders ────────────────────────────────

  const buildCrossTabData = (crossTabMap: Record<string, SegmentData[]> | undefined) => {
    if (!crossTabMap || Object.keys(crossTabMap).length === 0) return [];
    return Object.entries(crossTabMap).map(([parentName, children]) => {
      const segments = children.map((child) => ({
        name: child.name,
        value: child.data.find((d) => d.year === selectedYear)?.value ?? 0,
        fullData: child.data,
      }));
      return { name: parentName, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
    });
  };

  // Panel Type: sub-segments per parent
  const panelTypeCrossTab = segmentType === "panelType" ? buildCrossTabData(marketData.endUserByAircraftType) : [];

  // Resin Type: sub-resins per parent
  const resinTypeCrossTab = segmentType === "resinType" ? buildCrossTabData(marketData.materialTypeByRegion) : [];

  // Fiber Type: fiber per resin parent
  const fiberTypeCrossTab = segmentType === "fiberType" ? buildCrossTabData(marketData.equipmentByRegion) : [];

  // Form Type: form per resin parent
  const formTypeCrossTab = segmentType === "formType" ? buildCrossTabData(marketData.applicationByRegion) : [];

  // Get the sub-segment names for cross-tab chart legends
  const getCrossTabSegmentNames = (crossTabData: ReturnType<typeof buildCrossTabData>) => {
    const names = new Set<string>();
    crossTabData.forEach((bar) => bar.segments.forEach((seg) => names.add(seg.name)));
    return Array.from(names);
  };

  const panelTypeSubNames = getCrossTabSegmentNames(panelTypeCrossTab);
  const resinTypeSubNames = getCrossTabSegmentNames(resinTypeCrossTab);
  const fiberTypeSubNames = getCrossTabSegmentNames(fiberTypeCrossTab);
  const formTypeSubNames = getCrossTabSegmentNames(formTypeCrossTab);

  const allCountries: SegmentData[] = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion || {}).flat()
    : [];

  // ── Drill-down handlers ─────────────────────────────────────

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleStackedBarClick = (parentName: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${parentName})`, fullData, color, undefined);
  };

  // ── Cross-tab title helper ──────────────────────────────────

  const getCrossTabTitle = () => {
    switch (segmentType) {
      case "panelType": return "Panel Type Sub-Segments";
      case "resinType": return "Resin Sub-Type Breakdown";
      case "fiberType": return "Fiber Type by Resin Type";
      case "formType": return "Form Type by Resin Type";
      default: return "";
    }
  };

  return (
    <div className="space-y-8">
      {segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart data={totalMarket} segments={segmentData} title={`${title} - Market Trend`}
              subtitle="Historical and forecast data - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
          </div>
          <SegmentPieChart data={segmentData} year={selectedYear} title={title} onSegmentClick={handlePieSegmentClick} isVolume={isVolume} />
        </div>
      )}

      {segmentType === "panelType" && panelTypeCrossTab.length > 0 && panelTypeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={panelTypeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={`${selectedYear} breakdown by parent panel type`} segmentColors={CHART_COLORS} segmentNames={panelTypeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "resinType" && resinTypeCrossTab.length > 0 && resinTypeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={resinTypeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={`${selectedYear} breakdown by resin type`} segmentColors={CHART_COLORS} segmentNames={resinTypeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "fiberType" && fiberTypeCrossTab.length > 0 && fiberTypeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={fiberTypeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={`${selectedYear} breakdown by resin type`} segmentColors={CHART_COLORS} segmentNames={fiberTypeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "formType" && formTypeCrossTab.length > 0 && formTypeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={formTypeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={`${selectedYear} breakdown by resin type`} segmentColors={CHART_COLORS} segmentNames={formTypeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentData.length > 0 && (
        <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} - Growth Analysis`} onRowClick={handleTableRowClick} isVolume={isVolume} />
      )}

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} isVolume={isVolume} />
    </div>
  );
}
