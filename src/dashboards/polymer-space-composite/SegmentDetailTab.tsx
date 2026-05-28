/**
 * Segment Detail Tab — Polymer Space Composite Matrix Market
 * Cross-tabs:
 *   - Application (endUser) tab: Application by Region
 *   - Region tab: Region by Application, Region by Resin, Region by Fiber
 *   - Resin Type (application) tab: Resin by Application (from applicationByRegion)
 *   - Fiber Type (equipment) tab: Fiber by Application (from equipmentByRegion)
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
  const useMillions = true;
  const isVolume = unitMode === 'volume';

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const endUserNames = marketData.endUser.map((s) => s.name);
  const applicationNames = marketData.application.map((s) => s.name);
  const equipmentNames = marketData.furnishedEquipment.map((s) => s.name);
  const regionNames = marketData.region.map((s) => s.name);

  const buildByNestedData = (parentSegments: SegmentData[], nestedData: Record<string, SegmentData[]> | undefined) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    return parentSegments.map((parent) => {
      const segments = nestedData[parent.name] || [];
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: parent.name, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  const normalize = (s: string) => s.toLowerCase().replace(/[-\s]+/g, " ").trim();
  const buildRegionBySegment = (
    segmentList: SegmentData[],
    segByRegion: Record<string, SegmentData[]>
  ) => {
    if (Object.keys(segByRegion).length === 0) return [];
    return marketData.region.map((region) => {
      const segments = segmentList.map((seg) => {
        const d = segByRegion[seg.name]?.find(r => normalize(r.name) === normalize(region.name));
        return { name: seg.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
      });
      return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
    });
  };

  // Application tab: show Application by Region
  const endUserByRegionData = segmentType === "endUser" ? buildByNestedData(marketData.endUser, marketData.endUserByRegion) : [];
  // Application tab: show sub-components (stored in endUserByAircraftType)
  const endUserSubComponentData = segmentType === "endUser" ? buildByNestedData(marketData.endUser, marketData.endUserByAircraftType) : [];

  // Resin Type tab: show Resin by Application (applicationByRegion stores app→resin cross-tab)
  const resinByApplicationData = segmentType === "application" ? buildByNestedData(marketData.endUser, marketData.applicationByRegion) : [];

  // Fiber Type tab: show Fiber by Application
  const fiberByApplicationData = segmentType === "equipment" ? buildByNestedData(marketData.endUser, marketData.equipmentByRegion) : [];

  // Region tab: show Region by Application (inverted endUserByRegion)
  const regionByEndUserData = segmentType === "region" ? buildRegionBySegment(marketData.endUser, marketData.endUserByRegion) : [];

  const allCountries: SegmentData[] = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion || {}).flat()
    : [];

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "endUser") {
      // Drill down shows sub-components for applications
      const subComponents = marketData.endUserByAircraftType?.[segmentName];
      if (subComponents) return { title: `Components in ${segmentName}`, data: subComponents };
      const rd = marketData.endUserByRegion?.[segmentName];
      if (rd) return { title: `Regions for ${segmentName}`, data: rd };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "application") return { title: `By ${labels.endUser}`, data: marketData.endUser };
    if (segmentType === "equipment") return { title: `By ${labels.endUser}`, data: marketData.endUser };
    if (segmentType === "region") return { title: `By ${labels.endUser}`, data: marketData.endUser };
    return undefined;
  };

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleBarClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleStackedBarClick = (endUserType: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${endUserType})`, fullData, color, undefined);
  };

  // Get resin/fiber names for stacked bars in Resin/Fiber tabs
  const getResinNames = () => {
    const names = new Set<string>();
    Object.values(marketData.applicationByRegion || {}).forEach(segs => segs.forEach(s => names.add(s.name)));
    return Array.from(names);
  };
  const getFiberNames = () => {
    const names = new Set<string>();
    Object.values(marketData.equipmentByRegion || {}).forEach(segs => segs.forEach(s => names.add(s.name)));
    return Array.from(names);
  };

  return (
    <div className="space-y-8">
      {segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart data={totalMarket} segments={segmentData} title={`${title} - Market Trend`}
              subtitle="Historical and forecast data (US$ Millions) - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
          </div>
          <SegmentPieChart data={segmentData} year={selectedYear} title={title} onSegmentClick={handlePieSegmentClick} isVolume={isVolume} />
        </div>
      )}

      {/* Application tab: show sub-components breakdown */}
      {segmentType === "endUser" && endUserSubComponentData.length > 0 && endUserSubComponentData.some(d => d.total > 0) && (
        <StackedBarChart data={endUserSubComponentData} year={selectedYear} title={`${labels.endUser} by Component`}
          subtitle={`${selectedYear} component breakdown`} segmentColors={CHART_COLORS}
          segmentNames={(() => { const names = new Set<string>(); endUserSubComponentData.forEach(d => d.segments.forEach(s => names.add(s.name))); return Array.from(names); })()}
          onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Application tab: Application by Region */}
      {segmentType === "endUser" && endUserByRegionData.length > 0 && endUserByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={endUserByRegionData} year={selectedYear} title={`${labels.endUser} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Resin Type tab: Resin by Application */}
      {segmentType === "application" && resinByApplicationData.length > 0 && resinByApplicationData.some(d => d.total > 0) && (
        <StackedBarChart data={resinByApplicationData} year={selectedYear} title={`${labels.endUser} by ${labels.application}`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={getResinNames()} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Fiber Type tab: Fiber by Application */}
      {segmentType === "equipment" && fiberByApplicationData.length > 0 && fiberByApplicationData.some(d => d.total > 0) && (
        <StackedBarChart data={fiberByApplicationData} year={selectedYear} title={`${labels.endUser} by ${labels.equipment}`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={getFiberNames()} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Region tab: Region by Application */}
      {segmentType === "region" && regionByEndUserData.length > 0 && regionByEndUserData.some(d => d.total > 0) && (
        <StackedBarChart data={regionByEndUserData} year={selectedYear} title={`Region by ${labels.endUser}`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={endUserNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
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
