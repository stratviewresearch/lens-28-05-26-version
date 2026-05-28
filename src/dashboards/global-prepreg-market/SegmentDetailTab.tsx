/**
 * Segment Detail Tab — Global Prepreg Market dashboard.
 *
 * Naming convention: tab name first → "X by Y" on tab X, "Y by X" on tab Y.
 *
 * Cross-tabs (data only supports segment × region):
 * - Each segment tab: forward "X by Region" + inverse "Region by X"
 * - Region tab: 5 inverse "Region by X" charts + Countries trend
 * - Resin parent-level (Thermoset/Thermoplastic) × region is derived by
 *   summing each parent's sub-resin × region rows.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [resinSubTab, setResinSubTab] = useState<"thermoset" | "thermoplastic">("thermoset");
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const isVolume = unitMode === "volume";
  const useMillions = true;

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const regionNames = marketData.region.map(r => r.name);
  const normalize = (s: string) => s.toLowerCase().replace(/[-\s]+/g, " ").trim();

  // ── Derived: parent-level Resin × Region (Thermoset/Thermoplastic) ─────
  // Sum each parent's sub-resin × region rows to get parent × region.
  const buildResinParentByRegion = (): Record<string, SegmentData[]> => {
    const out: Record<string, SegmentData[]> = {};
    const sumChildren = (childMap: Record<string, SegmentData[]>): SegmentData[] => {
      // For each region, sum across all child sub-resins
      return marketData.region.map(region => {
        const yearMap = new Map<number, number>();
        Object.values(childMap).forEach(childRegions => {
          const match = childRegions.find(r => normalize(r.name) === normalize(region.name));
          match?.data.forEach(d => yearMap.set(d.year, (yearMap.get(d.year) ?? 0) + d.value));
        });
        return {
          name: region.name,
          data: marketData.years.map(y => ({ year: y, value: yearMap.get(y) ?? 0 })),
        };
      });
    };
    if (Object.keys(marketData.thermosetByRegion).length > 0) {
      out["Thermoset"] = sumChildren(marketData.thermosetByRegion);
    }
    if (Object.keys(marketData.thermoplasticByRegion).length > 0) {
      out["Thermoplastic"] = sumChildren(marketData.thermoplasticByRegion);
    }
    return out;
  };

  const resinParentByRegion = buildResinParentByRegion();

  // ── Forward builder: parent segment → stacked sub-segments per year ────
  const buildForward = (parentSegments: SegmentData[], nestedData: Record<string, SegmentData[]> | undefined) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    return parentSegments.map(parent => {
      const segments = (nestedData[parent.name] || []).map(seg => ({
        name: seg.name,
        value: seg.data.find(d => d.year === selectedYear)?.value ?? 0,
        fullData: seg.data,
      }));
      return { name: parent.name, segments, total: segments.reduce((s, x) => s + x.value, 0) };
    });
  };

  // ── Inverse builder: region → stacked segments per year ───────────────
  const buildRegionBySegment = (segmentList: SegmentData[], segByRegion: Record<string, SegmentData[]>) => {
    if (!segByRegion || Object.keys(segByRegion).length === 0) return [];
    return marketData.region.map(region => {
      const segments = segmentList.map(seg => {
        const d = segByRegion[seg.name]?.find(r => normalize(r.name) === normalize(region.name));
        return { name: seg.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
      });
      return { name: region.name, segments, total: segments.reduce((s, x) => s + x.value, 0) };
    });
  };

  // ── Forward cross-tabs (per segment tab) ──────────────────────────────
  const endUseFwd     = segmentType === "endUse"      ? buildForward(marketData.endUser, marketData.endUserByRegion) : [];
  const resinFwd      = segmentType === "resinType"   ? buildForward(marketData.materialType, resinParentByRegion) : [];
  const fiberFwd      = segmentType === "fiberType"   ? buildForward(marketData.furnishedEquipment, marketData.equipmentByRegion) : [];
  const formFwd       = segmentType === "formType"    ? buildForward(marketData.application, marketData.applicationByRegion) : [];
  const processFwd    = segmentType === "processType" ? buildForward(marketData.processType, marketData.processTypeByRegion) : [];

  // ── Inverse cross-tabs (per segment tab + region tab) ─────────────────
  const showRegionByEndUse  = segmentType === "region";
  const showRegionByResin   = segmentType === "region";
  const showRegionByFiber   = segmentType === "region";
  const showRegionByForm    = segmentType === "region";
  const showRegionByProcess = segmentType === "region";

  const regionByEndUse  = showRegionByEndUse  ? buildRegionBySegment(marketData.endUser, marketData.endUserByRegion) : [];
  const regionByResin   = showRegionByResin   ? buildRegionBySegment(marketData.materialType, resinParentByRegion) : [];
  const regionByFiber   = showRegionByFiber   ? buildRegionBySegment(marketData.furnishedEquipment, marketData.equipmentByRegion) : [];
  const regionByForm    = showRegionByForm    ? buildRegionBySegment(marketData.application, marketData.applicationByRegion) : [];
  const regionByProcess = showRegionByProcess ? buildRegionBySegment(marketData.processType, marketData.processTypeByRegion) : [];

  const endUserNames     = marketData.endUser.map(s => s.name);
  const resinNames       = marketData.materialType.map(s => s.name);
  const fiberNames       = marketData.furnishedEquipment.map(s => s.name);
  const formNames        = marketData.application.map(s => s.name);
  const processNames     = marketData.processType.map(s => s.name);

  // ── Drill-down handlers ─────────────────────────────────────
  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, undefined);
  const handleStackedBarClick = (parentName: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${parentName})`, fullData, color, undefined);
  };

  const allCountries: SegmentData[] = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion).flat()
    : [];

  const hasData = (d: { total: number }[]) => d.length > 0 && d.some(x => x.total > 0);

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

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Forward: X by Region (on segment tabs) */}
      {segmentType === "endUse" && hasData(endUseFwd) && (
        <StackedBarChart data={endUseFwd} year={selectedYear} title="End Use Industry by Region" subtitle={`${selectedYear} regional breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {segmentType === "resinType" && hasData(resinFwd) && (
        <StackedBarChart data={resinFwd} year={selectedYear} title="Resin Type by Region" subtitle={`${selectedYear} regional breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {segmentType === "fiberType" && hasData(fiberFwd) && (
        <StackedBarChart data={fiberFwd} year={selectedYear} title="Fiber Type by Region" subtitle={`${selectedYear} regional breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {segmentType === "formType" && hasData(formFwd) && (
        <StackedBarChart data={formFwd} year={selectedYear} title="Form Type by Region" subtitle={`${selectedYear} regional breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {segmentType === "processType" && hasData(processFwd) && (
        <StackedBarChart data={processFwd} year={selectedYear} title="Process Type by Region" subtitle={`${selectedYear} regional breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {/* Inverse: Region by X (on segment tabs and region tab) */}
      {showRegionByEndUse && hasData(regionByEndUse) && (
        <StackedBarChart data={regionByEndUse} year={selectedYear} title="Region by End Use Industry" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={endUserNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {showRegionByResin && hasData(regionByResin) && (
        <StackedBarChart data={regionByResin} year={selectedYear} title="Region by Resin Type" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={resinNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {showRegionByFiber && hasData(regionByFiber) && (
        <StackedBarChart data={regionByFiber} year={selectedYear} title="Region by Fiber Type" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={fiberNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {showRegionByForm && hasData(regionByForm) && (
        <StackedBarChart data={regionByForm} year={selectedYear} title="Region by Form Type" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={formNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}
      {showRegionByProcess && hasData(regionByProcess) && (
        <StackedBarChart data={regionByProcess} year={selectedYear} title="Region by Process Type" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={processNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentData.length > 0 && (
        <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} - Growth Analysis`} onRowClick={handleTableRowClick} isVolume={isVolume} />
      )}

      {segmentType === "resinType" && (marketData.thermosetSubResins.length > 0 || marketData.thermoplasticSubResins.length > 0) && (() => {
        const buildSubByRegion = (subs: SegmentData[], byRegion: Record<string, SegmentData[]>) => {
          if (!subs.length) return [];
          return subs.map(sub => {
            const regs = byRegion[sub.name] || [];
            const segments = regs.map(r => ({
              name: r.name,
              value: r.data.find(d => d.year === selectedYear)?.value ?? 0,
              fullData: r.data,
            }));
            return { name: sub.name, segments, total: segments.reduce((s, x) => s + x.value, 0) };
          });
        };
        const thermosetCT = buildSubByRegion(marketData.thermosetSubResins, marketData.thermosetByRegion);
        const thermoplasticCT = buildSubByRegion(marketData.thermoplasticSubResins, marketData.thermoplasticByRegion);
        const parentTotal = (subs: SegmentData[]): YearlyData[] =>
          marketData.years.map(y => ({ year: y, value: subs.reduce((s, sub) => s + (sub.data.find(d => d.year === y)?.value ?? 0), 0) }));
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Resin Sub-Type Breakdown</h3>
            <Tabs value={resinSubTab} onValueChange={(v) => setResinSubTab(v as "thermoset" | "thermoplastic")}>
              <TabsList>
                <TabsTrigger value="thermoset">Thermoset</TabsTrigger>
                <TabsTrigger value="thermoplastic">Thermoplastic</TabsTrigger>
              </TabsList>
              <TabsContent value="thermoset" className="space-y-6 mt-4">
                {marketData.thermosetSubResins.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <MarketTrendChart data={parentTotal(marketData.thermosetSubResins)} segments={marketData.thermosetSubResins}
                          title="Thermoset Sub-Resins - Market Trend" subtitle="Click legend to drill down"
                          showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
                      </div>
                      <SegmentPieChart data={marketData.thermosetSubResins} year={selectedYear} title="Thermoset Sub-Resins" onSegmentClick={handlePieSegmentClick} isVolume={isVolume} />
                    </div>
                    {hasData(thermosetCT) && (
                      <StackedBarChart data={thermosetCT} year={selectedYear} title="Thermoset Sub-Resin by Region"
                        subtitle={`${selectedYear} regional breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames}
                        onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
                    )}
                    <ComparisonTable data={marketData.thermosetSubResins} startYear={cagrStartYear} endYear={lastYear}
                      title="Thermoset Sub-Resins - Growth Analysis" onRowClick={handleTableRowClick} isVolume={isVolume} />
                  </>
                )}
              </TabsContent>
              <TabsContent value="thermoplastic" className="space-y-6 mt-4">
                {marketData.thermoplasticSubResins.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <MarketTrendChart data={parentTotal(marketData.thermoplasticSubResins)} segments={marketData.thermoplasticSubResins}
                          title="Thermoplastic Sub-Resins - Market Trend" subtitle="Click legend to drill down"
                          showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
                      </div>
                      <SegmentPieChart data={marketData.thermoplasticSubResins} year={selectedYear} title="Thermoplastic Sub-Resins" onSegmentClick={handlePieSegmentClick} isVolume={isVolume} />
                    </div>
                    {hasData(thermoplasticCT) && (
                      <StackedBarChart data={thermoplasticCT} year={selectedYear} title="Thermoplastic Sub-Resin by Region"
                        subtitle={`${selectedYear} regional breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames}
                        onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
                    )}
                    <ComparisonTable data={marketData.thermoplasticSubResins} startYear={cagrStartYear} endYear={lastYear}
                      title="Thermoplastic Sub-Resins - Growth Analysis" onRowClick={handleTableRowClick} isVolume={isVolume} />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        );
      })()}

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} isVolume={isVolume} />
    </div>
  );
}
