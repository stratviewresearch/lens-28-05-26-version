/**
 * Segment Detail Tab — Glass Fiber Prepreg Market dashboard.
 *
 * Cross-tabulations rendered on each tab:
 * - End Use:      End Use × Region  +  Region × End Use Industry
 * - Resin Type:   Resin Sub-Type Breakdown  +  Region × Resin Type
 *                 +  Region × Thermoplastic Prepreg Bifurcation
 *                 +  Region × Thermoset Prepreg Bifurcation
 * - Prepreg Type: Prepreg Type × Region  +  Region × Prepreg Type
 * - Process Type: Process Type × Region  +  Region × Process Type
 * - Region:       Country trend + all six Region × X stacked bars
 */

import { MarketTrendChart, SegmentPieChart, ComparisonTable, DrillDownModal, StackedBarChart, CHART_COLORS } from "./charts";
import { YearlyData, SegmentData, MarketData, useDrillDown } from "./data";
import { TabType, UnitMode } from "./config";

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

  /**
   * Invert a parent→children map into children→parents.
   * Used to flip "X by Region" maps into "Region by X" stacked bars.
   */
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

  /**
   * Sum two parent→region maps into a single resin-parent → region map at the
   * top level (Thermoplastic, Thermoset). Used because the workbook only stores
   * sub-resin × region, not top-level resin × region.
   */
  const buildResinTopRegionMap = (): Record<string, SegmentData[]> => {
    const out: Record<string, SegmentData[]> = {};
    const sumChildren = (children: SegmentData[]): SegmentData[] => {
      const byRegion: Record<string, YearlyData[]> = {};
      for (const seg of children) {
        for (const yd of seg.data) {
          if (!byRegion[seg.name]) byRegion[seg.name] = [];
        }
      }
      // children here are SegmentData[] of regions for one sub-resin — we need to flip:
      return children;
    };
    const aggregate = (parentMap: Record<string, SegmentData[]>): SegmentData[] => {
      // parentMap: sub-resin → regions[]. Sum across sub-resins per region.
      const regionTotals: Record<string, Map<number, number>> = {};
      for (const subRegions of Object.values(parentMap)) {
        for (const region of subRegions) {
          if (!regionTotals[region.name]) regionTotals[region.name] = new Map();
          for (const yd of region.data) {
            regionTotals[region.name].set(yd.year, (regionTotals[region.name].get(yd.year) ?? 0) + yd.value);
          }
        }
      }
      return Object.entries(regionTotals).map(([name, m]) => ({
        name,
        data: Array.from(m.entries()).map(([year, value]) => ({ year, value })).sort((a, b) => a.year - b.year),
      }));
    };

    if (marketData.thermoplasticByRegion && Object.keys(marketData.thermoplasticByRegion).length > 0) {
      out["Thermoplastic"] = aggregate(marketData.thermoplasticByRegion);
    }
    if (marketData.thermosetByRegion && Object.keys(marketData.thermosetByRegion).length > 0) {
      out["Thermoset"] = aggregate(marketData.thermosetByRegion);
    }
    return out;
  };

  const getCrossTabSegmentNames = (crossTabData: ReturnType<typeof buildCrossTabData>) => {
    const names = new Set<string>();
    crossTabData.forEach((bar) => bar.segments.forEach((seg) => names.add(seg.name)));
    return Array.from(names);
  };

  // Forward cross-tabs (X by Region / Resin Sub-Type)
  const endUseCrossTab = segmentType === "endUse" ? buildCrossTabData(marketData.endUserByRegion) : [];
  const endUseSubNames = getCrossTabSegmentNames(endUseCrossTab);

  const resinTypeCrossTab = segmentType === "resinType" ? buildCrossTabData(marketData.materialTypeByRegion) : [];
  const resinTypeSubNames = getCrossTabSegmentNames(resinTypeCrossTab);

  const prepregTypeCrossTab = segmentType === "prepregType" ? buildCrossTabData(marketData.applicationByRegion) : [];
  const prepregTypeSubNames = getCrossTabSegmentNames(prepregTypeCrossTab);

  const processTypeCrossTab = segmentType === "processType" ? buildCrossTabData(marketData.processTypeByRegion) : [];
  const processTypeSubNames = getCrossTabSegmentNames(processTypeCrossTab);

  // Inverse cross-tabs (Region by X) — built lazily per tab
  const resinTopByRegion = buildResinTopRegionMap(); // {Thermoplastic: regions[], Thermoset: regions[]}

  const regionByEndUse        = invertCrossTabMap(marketData.endUserByRegion);
  const regionByPrepregType   = invertCrossTabMap(marketData.applicationByRegion);
  const regionByProcessType   = invertCrossTabMap(marketData.processTypeByRegion);
  const regionByThermoplastic = invertCrossTabMap(marketData.thermoplasticByRegion);
  const regionByThermoset     = invertCrossTabMap(marketData.thermosetByRegion);
  // resinTopByRegion is already parent→region; invert to region→parent
  const regionByResinType     = invertCrossTabMap(resinTopByRegion);

  type Bar = ReturnType<typeof buildCrossTabData>;
  const buildInverted = (map: Record<string, SegmentData[]>): { bars: Bar; subNames: string[] } => {
    const bars = buildCrossTabData(map);
    return { bars, subNames: getCrossTabSegmentNames(bars) };
  };

  const inv = {
    endUse:        buildInverted(regionByEndUse),
    resinType:     buildInverted(regionByResinType),
    prepregType:   buildInverted(regionByPrepregType),
    processType:   buildInverted(regionByProcessType),
    thermoplastic: buildInverted(regionByThermoplastic),
    thermoset:     buildInverted(regionByThermoset),
  };

  // ── Drill-down handlers ─────────────────────────────────────

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleStackedBarClick = (parentName: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${parentName})`, fullData, color, undefined);
  };

  // ── Forward cross-tab title helpers ─────────────────────────

  const getCrossTabTitle = () => {
    switch (segmentType) {
      case "endUse": return "End Use Industry by Region";
      case "resinType": return "Resin Sub-Type Breakdown";
      case "prepregType": return "Fiber Architecture by Region";
      case "processType": return "Process Type by Region";
      default: return "";
    }
  };

  const getCrossTabSubtitle = () => {
    switch (segmentType) {
      case "resinType": return `${selectedYear} breakdown by resin parent type`;
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

  const allCountries: SegmentData[] = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion).flat()
    : [];

  // Helper to render an inverted Region-by-X stacked bar with guard
  const renderInverted = (
    title: string,
    bundle: { bars: Bar; subNames: string[] },
  ) => {
    if (bundle.bars.length === 0 || !bundle.bars.some(d => d.total > 0)) return null;
    return (
      <StackedBarChart
        data={bundle.bars}
        year={selectedYear}
        title={title}
        subtitle={`${selectedYear} breakdown across regions`}
        segmentColors={CHART_COLORS}
        segmentNames={bundle.subNames}
        onSegmentClick={handleStackedBarClick}
        useMillions={useMillions}
        isVolume={isVolume}
      />
    );
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

      {/* Forward cross-tab (X by Region / Resin Sub-Type / Country by Region) */}
      {activeCrossTab.length > 0 && activeCrossTab.some(d => d.total > 0) && (
        <StackedBarChart data={activeCrossTab} year={selectedYear} title={getCrossTabTitle()}
          subtitle={getCrossTabSubtitle()} segmentColors={CHART_COLORS} segmentNames={activeSubNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Inverse cross-tab (Region by X) per tab */}
      {segmentType === "endUse"      && renderInverted("Region by End Use Industry", inv.endUse)}
      {segmentType === "prepregType" && renderInverted("Region by Fiber Architecture", inv.prepregType)}
      {segmentType === "processType" && renderInverted("Region by Process Type", inv.processType)}
      {segmentType === "resinType" && (
        <>
          {renderInverted("Region by Resin Type", inv.resinType)}
          {renderInverted("Region by Thermoplastic Prepreg Bifurcation", inv.thermoplastic)}
          {renderInverted("Region by Thermoset Prepreg Bifurcation", inv.thermoset)}
        </>
      )}

      {/* Region tab: country trend + all Region-by-X bars */}
      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {segmentType === "region" && (
        <>
          {renderInverted("Region by End Use Industry", inv.endUse)}
          {renderInverted("Region by Resin Type", inv.resinType)}
          {renderInverted("Region by Fiber Architecture", inv.prepregType)}
          {renderInverted("Region by Process Type", inv.processType)}
          {renderInverted("Region by Thermoplastic Prepreg Bifurcation", inv.thermoplastic)}
          {renderInverted("Region by Thermoset Prepreg Bifurcation", inv.thermoset)}
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
