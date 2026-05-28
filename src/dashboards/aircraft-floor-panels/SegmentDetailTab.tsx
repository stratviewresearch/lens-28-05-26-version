/**
 * Segment Detail Tab — self-contained for this dashboard.
 * Reads labels and display rules from config.ts.
 */

import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { KPICard } from "./ui-helpers";
import { MarketTrendChart, SegmentPieChart, ComparisonTable, DrillDownModal, StackedBarChart, CHART_COLORS } from "./charts";
import { YearlyData, SegmentData, MarketData, calculateCAGR, useDrillDown } from "./data";
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
  const { useMillions, labels } = config;

  const currentYearTotal = segmentData.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];
  const valueFirstTotal = segmentData.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === cagrStartYear)?.value ?? 0), 0);
  const valueLastTotal = segmentData.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === lastYear)?.value ?? 0), 0);
  const cagr = calculateCAGR(valueFirstTotal, valueLastTotal, lastYear - cagrStartYear);

  const aircraftTypeNames = marketData.aircraftType.map((s) => s.name);
  const regionNames = marketData.region.map((s) => s.name);
  const applicationNames = marketData.application.map((s) => s.name);
  const equipmentNames = marketData.furnishedEquipment.map((s) => s.name);
  const endUserNames = marketData.endUser.map((s) => s.name);
  const processTypeNames = marketData.processType?.map((s) => s.name) || [];
  const materialTypeNames = marketData.materialType?.map((s) => s.name) || [];

  const getAllCountries = (): SegmentData[] => {
    const all: SegmentData[] = [];
    Object.values(marketData.countryDataByRegion).forEach((c) => all.push(...c));
    return all;
  };

  // ── Stacked bar data builders ───────────────────────────────

  const buildByNestedData = (parentSegments: SegmentData[], nestedData: Record<string, SegmentData[]> | undefined, reverseKey = false) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    if (reverseKey) {
      return Object.keys(nestedData).map((key) => {
        const segments = nestedData[key] || [];
        const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
        return { name: key, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
      });
    }
    return parentSegments.map((parent) => {
      const segments = nestedData[parent.name] || [];
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: parent.name, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  const getEquipmentByRegionData = () => {
    if (!marketData.equipmentByRegion) return [];
    return marketData.furnishedEquipment.map((equip) => {
      let segments = marketData.equipmentByRegion[equip.name];
      if (!segments) {
        const shortName = equip.name.includes("BFE") ? "BFE" : equip.name.includes("SFE") ? "SFE" : equip.name;
        segments = marketData.equipmentByRegion[shortName] || [];
      }
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: equip.name, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  // Compute stacked bar data based on active segment type
  const aircraftTypeStackedData = segmentType === "endUser" ? buildByNestedData([], marketData.endUserByAircraftType, true) : [];
  const regionStackedDataForEndUser = segmentType === "endUser" ? buildByNestedData([], marketData.endUserByRegion, true) : [];
  const aircraftByRegionData = segmentType === "aircraft" ? buildByNestedData(marketData.aircraftType, marketData.aircraftTypeByRegion) : [];
  const aircraftByEndUserData = segmentType === "aircraft" && Object.keys(marketData.endUserByAircraftType || {}).length > 0
    ? marketData.aircraftType.map((aircraft) => {
        const segments = endUserNames.map((euName) => {
          const euData = marketData.endUserByAircraftType?.[euName]?.find(s => s.name === aircraft.name);
          const value = euData?.data.find(d => d.year === selectedYear)?.value ?? 0;
          return { name: euName, value, fullData: euData?.data || [] };
        });
        return { name: aircraft.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
      }) : [];

  const regionByAircraftData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.aircraftType.map((aircraft) => {
      const d = marketData.aircraftTypeByRegion?.[aircraft.name]?.find(r => r.name === region.name);
      return { name: aircraft.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByApplicationData = (segmentType === "region" && marketData.application.length > 0 && marketData.applicationByRegion && Object.keys(marketData.applicationByRegion).length > 0) ? marketData.region.map((region) => {
    const segments = marketData.application.map((app) => {
      const d = marketData.applicationByRegion?.[app.name]?.find(r => r.name === region.name);
      return { name: app.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByEndUserData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = endUserNames.map((euName) => {
      const d = marketData.endUserByRegion?.[euName]?.find(r => r.name === region.name);
      return { name: euName, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByEquipmentData = segmentType === "region" ? marketData.region.map((region) => {
    const equipSegments = marketData.furnishedEquipment.map((equip) => {
      let entries = marketData.equipmentByRegion?.[equip.name];
      if (!entries) { const sn = equip.name.includes("BFE") ? "BFE" : equip.name.includes("SFE") ? "SFE" : equip.name; entries = marketData.equipmentByRegion?.[sn]; }
      const re = entries?.find(r => r.name === region.name);
      return { name: equip.name, value: re?.data.find(d => d.year === selectedYear)?.value ?? 0, fullData: re?.data || [] };
    });
    return { name: region.name, segments: equipSegments, total: equipSegments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByProcessData = segmentType === "region" && marketData.processType ? marketData.region.map((region) => {
    const segments = (marketData.processType || []).map((pt) => {
      const d = marketData.processTypeByRegion?.[pt.name]?.find(r => r.name === region.name);
      return { name: pt.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByMaterialData = segmentType === "region" && marketData.materialType ? marketData.region.map((region) => {
    const segments = (marketData.materialType || []).map((mt) => {
      const d = marketData.materialTypeByRegion?.[mt.name]?.find(r => r.name === region.name);
      return { name: mt.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const applicationByRegionData = segmentType === "application" ? buildByNestedData(marketData.application, marketData.applicationByRegion) : [];
  const equipmentByRegionData = segmentType === "equipment" ? getEquipmentByRegionData() : [];

  // For this dashboard, "process" tab maps to Core Type (materialType data)
  const processTypeByRegionData = segmentType === "process" ? buildByNestedData(marketData.materialType || [], marketData.materialTypeByRegion) : [];
  const processTypeByApplicationData: typeof aircraftByRegionData = [];
  const processTypeApplicationNames: string[] = [];

  const materialTypeByRegionData = segmentType === "material" ? buildByNestedData(marketData.materialType || [], marketData.materialTypeByRegion) : [];

  const allCountries = segmentType === "region" ? getAllCountries() : [];

  // ── Drill-down handlers ─────────────────────────────────────

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[segmentName])
      return { title: `Countries in ${segmentName}`, data: marketData.countryDataByRegion[segmentName] };
    if (segmentType === "aircraft") return { title: "Applications for this Aircraft Type", data: marketData.application };
    if (segmentType === "endUser") return { title: "Regions for this End User", data: marketData.region };
    if (segmentType === "application") return { title: "Aircraft Types by Application", data: marketData.aircraftType };
    if (segmentType === "equipment") {
      let rd = marketData.equipmentByRegion?.[segmentName];
      if (!rd) { const sn = segmentName.includes("BFE") ? "BFE" : segmentName.includes("SFE") ? "SFE" : segmentName; rd = marketData.equipmentByRegion?.[sn]; }
      if (rd) return { title: `Regions for ${segmentName}`, data: rd };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "process") {
      const prd = marketData.materialTypeByRegion?.[segmentName];
      if (prd) return { title: `Regions for ${segmentName}`, data: prd };
      return { title: "Regions", data: marketData.region };
    }
    if (segmentType === "material") {
      const mrd = marketData.materialTypeByRegion?.[segmentName];
      if (mrd) return { title: `Regions for ${segmentName}`, data: mrd };
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

  const hideKPIs = true; // All segment tabs hide KPI cards

  return (
    <div className="space-y-8">
      {!hideKPIs && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPICard title={`${selectedYear} Market Size`} value={useMillions ? currentYearTotal : currentYearTotal / 1000} suffix={useMillions ? "M" : "B"} icon={DollarSign} delay={0} accentColor="primary" />
          <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagr} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
          <KPICard title={`${lastYear} Forecast`} value={useMillions ? valueLastTotal : valueLastTotal / 1000} suffix={useMillions ? "M" : "B"} icon={TrendingUp} delay={0.2} accentColor="accent" />
        </div>
      )}

      {segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart data={totalMarket} segments={segmentData} title={`${title} - Market Trend`}
              subtitle="Historical and forecast data (US$ Millions) - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} />
          </div>
          <SegmentPieChart data={segmentData} year={selectedYear} title={title} onSegmentClick={handlePieSegmentClick} />
        </div>
      )}

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data (US$ Millions)" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} />
      )}

      {segmentType === "endUser" && (
        <>
          {aircraftTypeStackedData.length > 0 && aircraftTypeStackedData.some(d => d.total > 0) && (
            <StackedBarChart data={aircraftTypeStackedData} year={selectedYear} title={`OE vs Aftermarket by Aircraft Type`}
              subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={aircraftTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionStackedDataForEndUser.length > 0 && regionStackedDataForEndUser.some(d => d.total > 0) && (
            <StackedBarChart data={regionStackedDataForEndUser} year={selectedYear} title={`${labels.endUser} by Region`}
              subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
        </>
      )}

      {segmentType === "aircraft" && (
        <>
          {aircraftByRegionData.length > 0 && aircraftByRegionData.some(d => d.total > 0) && (
            <StackedBarChart data={aircraftByRegionData} year={selectedYear} title="Aircraft Type by Region" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {aircraftByEndUserData.length > 0 && aircraftByEndUserData.some(d => d.total > 0) && (
            <StackedBarChart data={aircraftByEndUserData} year={selectedYear} title={`Aircraft Type by ${labels.endUser}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={endUserNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
        </>
      )}

      {segmentType === "region" && (
        <>
          {regionByAircraftData.length > 0 && regionByAircraftData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByAircraftData} year={selectedYear} title="Region by Aircraft Type" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={aircraftTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByApplicationData.length > 0 && regionByApplicationData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByApplicationData} year={selectedYear} title={`Region by ${labels.application}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={applicationNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByEndUserData.length > 0 && regionByEndUserData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEndUserData} year={selectedYear} title={`Region by ${labels.endUser}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={endUserNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByEquipmentData.length > 0 && regionByEquipmentData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEquipmentData} year={selectedYear} title={`Region by ${labels.equipment}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={equipmentNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByProcessData.length > 0 && regionByProcessData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByProcessData} year={selectedYear} title={`Region by ${labels.processType}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={processTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByMaterialData.length > 0 && regionByMaterialData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByMaterialData} year={selectedYear} title={`Region by ${labels.materialType}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={materialTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
        </>
      )}

      {segmentType === "application" && applicationByRegionData.length > 0 && applicationByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={applicationByRegionData} year={selectedYear} title={`${labels.application} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "equipment" && equipmentByRegionData.length > 0 && equipmentByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={equipmentByRegionData} year={selectedYear} title={`${labels.equipment} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "process" && processTypeByRegionData.length > 0 && processTypeByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={processTypeByRegionData} year={selectedYear} title={`${labels.processType} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}
      {segmentType === "process" && processTypeByApplicationData.length > 0 && processTypeByApplicationData.some(d => d.total > 0) && (
        <StackedBarChart data={processTypeByApplicationData} year={selectedYear} title={`${labels.processType} by Application`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={processTypeApplicationNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "material" && materialTypeByRegionData.length > 0 && materialTypeByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={materialTypeByRegionData} year={selectedYear} title={`${labels.materialType} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentData.length > 0 && (
        <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} - Growth Analysis`} onRowClick={handleTableRowClick} />
      )}

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} />
    </div>
  );
}
