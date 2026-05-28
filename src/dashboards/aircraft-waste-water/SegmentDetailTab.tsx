/**
 * Segment Detail Tab — self-contained for Aircraft Water/Waste Water dashboard.
 */

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

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const regionNames = marketData.region.map((s) => s.name);
  const aircraftTypeNames = marketData.aircraftType.map((s) => s.name);
  const endUserNames = marketData.endUser.map((s) => s.name);
  const waterSystemNames = marketData.waterSystemType.map((s) => s.name);
  const equipmentNames = marketData.furnishedEquipment.map((s) => s.name);
  const componentNames = marketData.componentType.map((s) => s.name);

  const getAllCountries = (): SegmentData[] => {
    const all: SegmentData[] = [];
    Object.values(marketData.countryDataByRegion).forEach((c) => all.push(...c));
    return all;
  };

  const buildByNestedData = (parentSegments: SegmentData[], nestedData: Record<string, SegmentData[]> | undefined) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    return parentSegments.map((parent) => {
      const segments = nestedData[parent.name] || [];
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: parent.name, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  const buildByNestedReverse = (nestedData: Record<string, SegmentData[]> | undefined) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    return Object.keys(nestedData).map((key) => {
      const segments = nestedData[key] || [];
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: key, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  // End User tab — × Aircraft Type AND × Region
  const endUserByAircraftData = segmentType === "endUser" ? buildByNestedReverse(marketData.endUserByAircraftType) : [];
  const endUserByRegionData = segmentType === "endUser" ? buildByNestedReverse(marketData.endUserByRegion) : [];

  // Aircraft Type tab — × Region
  const aircraftByRegionData = segmentType === "aircraft" ? buildByNestedData(marketData.aircraftType, marketData.aircraftTypeByRegion) : [];

  // Water System tab — × Region
  const waterSystemByRegionData = segmentType === "waterSystem" ? buildByNestedData(marketData.waterSystemType, marketData.waterSystemByRegion) : [];

  // Equipment tab — × Region
  const equipmentByRegionData = segmentType === "equipment" ? buildByNestedData(marketData.furnishedEquipment, marketData.equipmentByRegion) : [];

  // Component tab — × Region
  const componentByRegionData = segmentType === "component" ? buildByNestedData(marketData.componentType, marketData.componentByRegion) : [];

  // Region tab — cross-tabs
  const regionByAircraftData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.aircraftType.map((aircraft) => {
      const d = marketData.aircraftTypeByRegion?.[aircraft.name]?.find(r => r.name === region.name);
      return { name: aircraft.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
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

  const regionByWaterSystemData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.waterSystemType.map((ws) => {
      const d = marketData.waterSystemByRegion?.[ws.name]?.find(r => r.name === region.name);
      return { name: ws.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByEquipmentData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.furnishedEquipment.map((equip) => {
      const d = marketData.equipmentByRegion?.[equip.name]?.find(r => r.name === region.name);
      return { name: equip.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByComponentData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.componentType.map((comp) => {
      const d = marketData.componentByRegion?.[comp.name]?.find(r => r.name === region.name);
      return { name: comp.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const allCountries = segmentType === "region" ? getAllCountries() : [];

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[segmentName])
      return { title: `Countries in ${segmentName}`, data: marketData.countryDataByRegion[segmentName] };
    if (segmentType === "aircraft") return { title: "By Region", data: marketData.region };
    if (segmentType === "endUser") return { title: "By Region", data: marketData.region };
    if (segmentType === "waterSystem") return { title: "By Region", data: marketData.region };
    if (segmentType === "equipment") return { title: "By Region", data: marketData.region };
    if (segmentType === "component") return { title: "By Region", data: marketData.region };
    return undefined;
  };

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleTrendSegmentClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleTableRowClick = (name: string, data: YearlyData[], color: string) => openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleStackedBarClick = (parentName: string, segmentName: string, _value: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(`${segmentName} (${parentName})`, fullData, color, undefined);
  };

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

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data (US$ Millions)" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} />
      )}

      {/* End User tab: × Aircraft Type */}
      {segmentType === "endUser" && endUserByAircraftData.length > 0 && endUserByAircraftData.some(d => d.total > 0) && (
        <StackedBarChart data={endUserByAircraftData} year={selectedYear} title={`${labels.endUser} by Aircraft Type`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={aircraftTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {/* End User tab: × Region */}
      {segmentType === "endUser" && endUserByRegionData.length > 0 && endUserByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={endUserByRegionData} year={selectedYear} title={`${labels.endUser} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "aircraft" && aircraftByRegionData.length > 0 && aircraftByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={aircraftByRegionData} year={selectedYear} title="Aircraft Type by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "waterSystem" && waterSystemByRegionData.length > 0 && waterSystemByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={waterSystemByRegionData} year={selectedYear} title={`${labels.waterSystem} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "equipment" && equipmentByRegionData.length > 0 && equipmentByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={equipmentByRegionData} year={selectedYear} title={`${labels.equipment} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "component" && componentByRegionData.length > 0 && componentByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={componentByRegionData} year={selectedYear} title={`${labels.component} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "region" && (
        <>
          {regionByAircraftData.length > 0 && regionByAircraftData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByAircraftData} year={selectedYear} title="Region by Aircraft Type" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={aircraftTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByEndUserData.length > 0 && regionByEndUserData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEndUserData} year={selectedYear} title={`Region by ${labels.endUser}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={endUserNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByWaterSystemData.length > 0 && regionByWaterSystemData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByWaterSystemData} year={selectedYear} title={`Region by ${labels.waterSystem}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={waterSystemNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByEquipmentData.length > 0 && regionByEquipmentData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEquipmentData} year={selectedYear} title={`Region by ${labels.equipment}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={equipmentNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByComponentData.length > 0 && regionByComponentData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByComponentData} year={selectedYear} title={`Region by ${labels.component}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={componentNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
        </>
      )}

      <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} — Comparison`} onRowClick={handleTableRowClick} />

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName} segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} />
    </div>
  );
}
