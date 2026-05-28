/**
 * Segment Detail Tab — self-contained for Thermoplastic Prepreg dashboard.
 * No Aircraft Type in this market. Cross-tabs are segment-by-region.
 */

import { useState } from "react";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [resinSubTab, setResinSubTab] = useState<"thermoset" | "thermoplastic">("thermoset");
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { labels } = config;
  const isVolume = unitMode === "volume";
  const useMillions = true;

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const regionNames = marketData.region.map((s) => s.name);
  const endUserNames = marketData.endUser.map((s) => s.name);
  const applicationNames = marketData.application.map((s) => s.name);
  const equipmentNames = marketData.furnishedEquipment.map((s) => s.name);
  const processTypeNames = marketData.processType?.map((s) => s.name) || [];
  const materialTypeNames = marketData.materialType?.map((s) => s.name) || [];

  const getAllCountries = (): SegmentData[] => {
    const all: SegmentData[] = [];
    Object.values(marketData.countryDataByRegion).forEach((c) => all.push(...c));
    return all;
  };

  // ── Stacked bar data builders ───────────────────────────────

  const buildByNestedData = (parentSegments: SegmentData[], nestedData: Record<string, SegmentData[]> | undefined) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    return parentSegments.map((parent) => {
      const segments = nestedData[parent.name] || [];
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: parent.name, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  // Build reverse cross-tab: region by X
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

  // End Use Industry by Region
  const endUserByRegionData = segmentType === "endUser" ? buildByNestedData(marketData.endUser, marketData.endUserByRegion) : [];

  // Resin Type by Region
  const materialByRegionData = segmentType === "material" ? buildByNestedData(marketData.materialType || [], marketData.materialTypeByRegion) : [];

  // Product Form by Region
  const applicationByRegionData = segmentType === "application" ? buildByNestedData(marketData.application, marketData.applicationByRegion) : [];

  // Fiber Type by Region
  const equipmentByRegionData = segmentType === "equipment" ? buildByNestedData(marketData.furnishedEquipment, marketData.equipmentByRegion) : [];

  // Process Type by Region
  const processTypeByRegionData = segmentType === "process" ? buildByNestedData(marketData.processType || [], marketData.processTypeByRegion) : [];

  // Region tab: cross-tabs
  const regionByEndUserData = segmentType === "region" ? buildRegionBySegment(marketData.endUser, marketData.endUserByRegion) : [];
  const regionByMaterialData = segmentType === "region" ? buildRegionBySegment(marketData.materialType || [], marketData.materialTypeByRegion || {}) : [];
  const regionByApplicationData = segmentType === "region" ? buildRegionBySegment(marketData.application, marketData.applicationByRegion || {}) : [];
  const regionByEquipmentData = segmentType === "region" ? buildRegionBySegment(marketData.furnishedEquipment, marketData.equipmentByRegion || {}) : [];
  const regionByProcessData = segmentType === "region" ? buildRegionBySegment(marketData.processType || [], marketData.processTypeByRegion || {}) : [];

  const allCountries = segmentType === "region" ? getAllCountries() : [];

  // ── Drill-down handlers ─────────────────────────────────────

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[segmentName])
      return { title: `Countries in ${segmentName}`, data: marketData.countryDataByRegion[segmentName] };
    if (segmentType === "endUser") {
      const rd = marketData.endUserByRegion?.[segmentName];
      if (rd) return { title: `Regions for ${segmentName}`, data: rd };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "material") {
      const mrd = marketData.materialTypeByRegion?.[segmentName];
      if (mrd) return { title: `Regions for ${segmentName}`, data: mrd };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "application") {
      const ard = marketData.applicationByRegion?.[segmentName];
      if (ard) return { title: `Regions for ${segmentName}`, data: ard };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "equipment") {
      const erd = marketData.equipmentByRegion?.[segmentName];
      if (erd) return { title: `Regions for ${segmentName}`, data: erd };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "process") {
      const prd = marketData.processTypeByRegion?.[segmentName];
      if (prd) return { title: `Regions for ${segmentName}`, data: prd };
      return { title: "Regions", data: marketData.region };
    }
    return undefined;
  };

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleBarClick = (name: string, data: YearlyData[], color: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[name])
      openDrillDown(name, data, color, { title: `Countries in ${name}`, data: marketData.countryDataByRegion[name] });
    else openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  };
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleStackedBarClick = (endUserType: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${endUserType})`, fullData, color, undefined);
  };

  return (
    <div className="space-y-8">
      {segmentType !== "endUser" && segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart data={totalMarket} segments={segmentData} title={`${title} - Market Trend`}
              subtitle="Historical and forecast data (US$ Millions) - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
          </div>
          <SegmentPieChart data={segmentData} year={selectedYear} title={title} onSegmentClick={handlePieSegmentClick} isVolume={isVolume} />
        </div>
      )}

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data (US$ Millions)" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "endUser" && (marketData.thermosetSubResins.length > 0 || marketData.thermoplasticSubResins.length > 0) && (() => {
        const buildSubByRegion = (subs: SegmentData[]) => subs.map(sub => {
          const regs = marketData.endUserByRegion[sub.name] || [];
          const segments = regs.map(r => ({
            name: r.name,
            value: r.data.find(d => d.year === selectedYear)?.value ?? 0,
            fullData: r.data,
          }));
          return { name: sub.name, segments, total: segments.reduce((s, x) => s + x.value, 0) };
        });
        const thermosetCT = buildSubByRegion(marketData.thermosetSubResins);
        const thermoplasticCT = buildSubByRegion(marketData.thermoplasticSubResins);
        const parentTotal = (subs: SegmentData[]): YearlyData[] =>
          marketData.years.map(y => ({ year: y, value: subs.reduce((s, sub) => s + (sub.data.find(d => d.year === y)?.value ?? 0), 0) }));
        const hasCT = (ct: ReturnType<typeof buildSubByRegion>) => ct.length > 0 && ct.some(d => d.total > 0);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{labels.endUser} Breakdown</h3>
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
                    {hasCT(thermosetCT) && (
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
                    {hasCT(thermoplasticCT) && (
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

      {segmentType === "material" && materialByRegionData.length > 0 && materialByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={materialByRegionData} year={selectedYear} title={`${labels.materialType} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "application" && applicationByRegionData.length > 0 && applicationByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={applicationByRegionData} year={selectedYear} title={`${labels.application} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "equipment" && equipmentByRegionData.length > 0 && equipmentByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={equipmentByRegionData} year={selectedYear} title={`${labels.equipment} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "process" && processTypeByRegionData.length > 0 && processTypeByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={processTypeByRegionData} year={selectedYear} title={`${labels.processType} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
      )}

      {segmentType === "region" && (
        <>
          {regionByEndUserData.length > 0 && regionByEndUserData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEndUserData} year={selectedYear} title={`Region by ${labels.endUser}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={endUserNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
          )}
          {regionByMaterialData.length > 0 && regionByMaterialData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByMaterialData} year={selectedYear} title={`Region by ${labels.materialType}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={materialTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
          )}
          {regionByApplicationData.length > 0 && regionByApplicationData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByApplicationData} year={selectedYear} title={`Region by ${labels.application}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={applicationNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
          )}
          {regionByEquipmentData.length > 0 && regionByEquipmentData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEquipmentData} year={selectedYear} title={`Region by ${labels.equipment}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={equipmentNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
          )}
          {regionByProcessData.length > 0 && regionByProcessData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByProcessData} year={selectedYear} title={`Region by ${labels.processType}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={processTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} isVolume={isVolume} />
          )}
        </>
      )}

      {segmentType !== "endUser" && segmentData.length > 0 && (
        <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} - Growth Analysis`} onRowClick={handleTableRowClick} isVolume={isVolume} />
      )}

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} isVolume={isVolume} />
    </div>
  );
}
