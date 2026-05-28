/**
 * Segment Detail Tab — Aramid Fiber Prepreg Market dashboard.
 * Cross-tabs:
 * - End Use Industry: region breakdown per end-use
 * - Resin Type: sub-resin breakdown per parent (Thermoset/Thermoplastic)
 * - Prepreg Type: region breakdown per prepreg type
 * - Process Type: region breakdown per process type
 * - Region: country breakdown per region
 */

import { MarketTrendChart, SegmentPieChart, ComparisonTable, DrillDownModal, StackedBarChart, CHART_COLORS } from "./charts";
import { YearlyData, SegmentData, MarketData, useDrillDown } from "./data";
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

  const getCrossTabSegmentNames = (crossTabData: ReturnType<typeof buildCrossTabData>) => {
    const names = new Set<string>();
    crossTabData.forEach((bar) => bar.segments.forEach((seg) => names.add(seg.name)));
    return Array.from(names);
  };

  // End Use: region cross-tabs
  const endUseCrossTab = segmentType === "endUse" ? buildCrossTabData(marketData.endUserByRegion) : [];
  const endUseSubNames = getCrossTabSegmentNames(endUseCrossTab);

  // Resin Type: sub-resin cross-tabs
  const resinTypeCrossTab = segmentType === "resinType" ? buildCrossTabData(marketData.materialTypeByRegion) : [];
  const resinTypeSubNames = getCrossTabSegmentNames(resinTypeCrossTab);

  // Prepreg Type: region cross-tabs
  const prepregTypeCrossTab = segmentType === "prepregType" ? buildCrossTabData(marketData.applicationByRegion) : [];
  const prepregTypeSubNames = getCrossTabSegmentNames(prepregTypeCrossTab);

  // Process Type: region cross-tabs
  const processTypeCrossTab = segmentType === "processType" ? buildCrossTabData(marketData.processTypeByRegion) : [];
  const processTypeSubNames = getCrossTabSegmentNames(processTypeCrossTab);

  // Region: country cross-tabs
  const regionCrossTab = segmentType === "region" ? buildCrossTabData(marketData.countryDataByRegion) : [];
  const regionSubNames = getCrossTabSegmentNames(regionCrossTab);

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
      case "endUse": return "End Use Industry by Region";
      case "resinType": return "Resin Sub-Type Breakdown";
      case "prepregType": return "Prepreg Type by Region";
      case "processType": return "Process Type by Region";
      case "region": return "Country Breakdown by Region";
      default: return "";
    }
  };

  const getCrossTabSubtitle = () => {
    switch (segmentType) {
      case "resinType": return `${selectedYear} breakdown by resin parent type`;
      case "region": return `${selectedYear} country-level breakdown`;
      default: return `${selectedYear} regional breakdown`;
    }
  };

  // Select the active cross-tab data
  let activeCrossTab: ReturnType<typeof buildCrossTabData> = [];
  let activeSubNames: string[] = [];
  switch (segmentType) {
    case "endUse": activeCrossTab = endUseCrossTab; activeSubNames = endUseSubNames; break;
    case "resinType": activeCrossTab = resinTypeCrossTab; activeSubNames = resinTypeSubNames; break;
    case "prepregType": activeCrossTab = prepregTypeCrossTab; activeSubNames = prepregTypeSubNames; break;
    case "processType": activeCrossTab = processTypeCrossTab; activeSubNames = processTypeSubNames; break;
    case "region": activeCrossTab = []; activeSubNames = []; break;
  }

  const allCountries: SegmentData[] = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion).flat()
    : [];

  // Region-tab inverted cross-tabs ("Region by X")
  const regionInversions = segmentType === "region" ? [
    { key: "endUse", title: "Region by End Use Industry", map: marketData.regionByEndUse },
    { key: "resinType", title: "Region by Resin Type", map: marketData.regionByResinType },
    { key: "thermoplasticBif", title: "Region by Thermoplastic Bifurcation", map: marketData.regionByThermoplasticBif },
    { key: "thermosetBif", title: "Region by Thermoset Bifurcation", map: marketData.regionByThermosetBif },
    { key: "prepregType", title: "Region by Prepreg Type", map: marketData.regionByPrepregType },
    { key: "processType", title: "Region by Process Type", map: marketData.regionByProcessType },
  ].map(({ key, title, map }) => {
    const data = buildCrossTabData(map);
    return { key, title, data, subNames: getCrossTabSegmentNames(data) };
  }).filter(x => x.data.length > 0 && x.data.some(d => d.total > 0)) : [];

  // Resin Type tab — bifurcation by region (parent = sub-resin, segments = regions)
  const thermoplasticBifByRegion = segmentType === "resinType" ? buildCrossTabData(marketData.thermoplasticByRegion) : [];
  const thermosetBifByRegion = segmentType === "resinType" ? buildCrossTabData(marketData.thermosetByRegion) : [];
  const thermoplasticBifByRegionNames = getCrossTabSegmentNames(thermoplasticBifByRegion);
  const thermosetBifByRegionNames = getCrossTabSegmentNames(thermosetBifByRegion);

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

      {activeCrossTab.length > 0 && activeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={activeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={getCrossTabSubtitle()} segmentColors={CHART_COLORS} segmentNames={activeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "resinType" && thermoplasticBifByRegion.length > 0 && thermoplasticBifByRegion.some(d => d.total > 0) && (
        <StackedBarChart data={thermoplasticBifByRegion} year={selectedYear} title="Thermoplastic Bifurcation by Region"
          subtitle={`${selectedYear} regional breakdown of thermoplastic sub-resins`} segmentColors={CHART_COLORS} segmentNames={thermoplasticBifByRegionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "resinType" && thermosetBifByRegion.length > 0 && thermosetBifByRegion.some(d => d.total > 0) && (
        <StackedBarChart data={thermosetBifByRegion} year={selectedYear} title="Thermoset Bifurcation by Region"
          subtitle={`${selectedYear} regional breakdown of thermoset sub-resins`} segmentColors={CHART_COLORS} segmentNames={thermosetBifByRegionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {regionInversions.map(({ key, title: rt, data, subNames }) => (
        <StackedBarChart key={key} data={data} year={selectedYear} title={rt}
          subtitle={`${selectedYear} breakdown by region`} segmentColors={CHART_COLORS} segmentNames={subNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      ))}

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
