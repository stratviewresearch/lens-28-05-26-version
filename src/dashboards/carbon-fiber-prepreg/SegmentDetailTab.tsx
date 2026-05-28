/**
 * Segment Detail Tab — Carbon Fiber Prepreg Market dashboard.
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

  const invertCrossTabMap = (map: Record<string, SegmentData[]> | undefined): Record<string, SegmentData[]> => {
    if (!map) return {};
    const inverted: Record<string, SegmentData[]> = {};
    for (const [parent, children] of Object.entries(map)) {
      for (const child of children) {
        if (!inverted[child.name]) inverted[child.name] = [];
        inverted[child.name].push({ name: parent, data: child.data });
      }
    }
    return inverted;
  };

  const endUseCrossTab = segmentType === "endUse" ? buildCrossTabData(marketData.endUserByRegion) : [];
  const endUseSubNames = getCrossTabSegmentNames(endUseCrossTab);

  const resinTypeCrossTab = segmentType === "resinType" ? buildCrossTabData(marketData.materialTypeByRegion) : [];
  const resinTypeSubNames = getCrossTabSegmentNames(resinTypeCrossTab);

  const prepregTypeCrossTab = segmentType === "prepregType" ? buildCrossTabData(marketData.applicationByRegion) : [];
  const prepregTypeSubNames = getCrossTabSegmentNames(prepregTypeCrossTab);

  const processTypeCrossTab = segmentType === "processType" ? buildCrossTabData(marketData.processTypeByRegion) : [];
  const processTypeSubNames = getCrossTabSegmentNames(processTypeCrossTab);

  // Resin Type extra cross-tabs
  const resinTopByRegionTab = segmentType === "resinType" ? buildCrossTabData(marketData.resinTopByRegion) : [];
  const resinTopByRegionNames = getCrossTabSegmentNames(resinTopByRegionTab);

  const thermosetByRegionTab = segmentType === "resinType" ? buildCrossTabData(marketData.thermosetByRegion) : [];
  const thermosetByRegionNames = getCrossTabSegmentNames(thermosetByRegionTab);

  const thermoplasticByRegionTab = segmentType === "resinType" ? buildCrossTabData(marketData.thermoplasticByRegion) : [];
  const thermoplasticByRegionNames = getCrossTabSegmentNames(thermoplasticByRegionTab);

  // Region tab: inverted Region-by-X stacked bars
  type Bar = ReturnType<typeof buildCrossTabData>;
  const buildInverted = (map: Record<string, SegmentData[]> | undefined): { bars: Bar; subNames: string[] } => {
    const bars = buildCrossTabData(invertCrossTabMap(map));
    return { bars, subNames: getCrossTabSegmentNames(bars) };
  };

  const inv = segmentType === "region" ? {
    endUse:        buildInverted(marketData.endUserByRegion),
    resinType:     buildInverted(marketData.resinTopByRegion),
    prepregType:   buildInverted(marketData.applicationByRegion),
    processType:   buildInverted(marketData.processTypeByRegion),
    thermoset:     buildInverted(marketData.thermosetByRegion),
    thermoplastic: buildInverted(marketData.thermoplasticByRegion),
  } : null;

  const allCountries: SegmentData[] = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion).flat()
    : [];

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleStackedBarClick = (parentName: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${parentName})`, fullData, color, undefined);
  };

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

  let activeCrossTab: ReturnType<typeof buildCrossTabData> = [];
  let activeSubNames: string[] = [];
  switch (segmentType) {
    case "endUse": activeCrossTab = endUseCrossTab; activeSubNames = endUseSubNames; break;
    case "resinType": activeCrossTab = resinTypeCrossTab; activeSubNames = resinTypeSubNames; break;
    case "prepregType": activeCrossTab = prepregTypeCrossTab; activeSubNames = prepregTypeSubNames; break;
    case "processType": activeCrossTab = processTypeCrossTab; activeSubNames = processTypeSubNames; break;
    case "region": break;
  }

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

      {segmentType === "resinType" && resinTopByRegionTab.length > 0 && resinTopByRegionTab.some(d => d.total > 0) && (
        <StackedBarChart data={resinTopByRegionTab} year={selectedYear} title="Resin Type by Region"
          subtitle={`${selectedYear} regional breakdown`} segmentColors={CHART_COLORS} segmentNames={resinTopByRegionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {activeCrossTab.length > 0 && activeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={activeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={getCrossTabSubtitle()} segmentColors={CHART_COLORS} segmentNames={activeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "resinType" && thermosetByRegionTab.length > 0 && thermosetByRegionTab.some(d => d.total > 0) && (
        <StackedBarChart data={thermosetByRegionTab} year={selectedYear} title="Thermoset Sub-Types by Region"
          subtitle={`${selectedYear} regional breakdown of thermoset sub-resins`} segmentColors={CHART_COLORS} segmentNames={thermosetByRegionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "resinType" && thermoplasticByRegionTab.length > 0 && thermoplasticByRegionTab.some(d => d.total > 0) && (
        <StackedBarChart data={thermoplasticByRegionTab} year={selectedYear} title="Thermoplastic Sub-Types by Region"
          subtitle={`${selectedYear} regional breakdown of thermoplastic sub-resins`} segmentColors={CHART_COLORS} segmentNames={thermoplasticByRegionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "region" && inv && (
        <>
          {[
            { title: "Region by End Use Industry", bundle: inv.endUse },
            { title: "Region by Resin Type", bundle: inv.resinType },
            { title: "Region by Prepreg Type", bundle: inv.prepregType },
            { title: "Region by Process Type", bundle: inv.processType },
            { title: "Region by Thermoset Sub-Types", bundle: inv.thermoset },
            { title: "Region by Thermoplastic Sub-Types", bundle: inv.thermoplastic },
          ].map(({ title: t, bundle }) =>
            bundle.bars.length > 0 && bundle.bars.some(d => d.total > 0) ? (
              <StackedBarChart key={t} data={bundle.bars} year={selectedYear} title={t}
                subtitle={`${selectedYear} breakdown across regions`} segmentColors={CHART_COLORS}
                segmentNames={bundle.subNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
            ) : null
          )}
        </>
      )}

      {segmentData.length > 0 && (
        <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} - Growth Analysis`} onRowClick={handleTableRowClick} isVolume={isVolume} />
      )}

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} isVolume={isVolume} />
    </div>
  );
}
