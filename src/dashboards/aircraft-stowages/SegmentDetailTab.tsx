/**
 * Segment Detail Tab — self-contained for Aircraft Stowages dashboard.
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
  const equipmentNames = marketData.furnishedEquipment.map((s) => s.name);
  const stowageTypeNames = marketData.stowageType.map((s) => s.name);

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

  // Equipment tab — × Region
  const equipmentByRegionData = segmentType === "equipment" ? buildByNestedData(marketData.furnishedEquipment, marketData.equipmentByRegion) : [];

  // Stowage Type tab — × Region
  const stowageTypeByRegionData = segmentType === "stowageType" ? buildByNestedData(marketData.stowageType, marketData.stowageTypeByRegion) : [];

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

  const regionByEquipmentData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.furnishedEquipment.map((equip) => {
      const d = marketData.equipmentByRegion?.[equip.name]?.find(r => r.name === region.name);
      return { name: equip.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const regionByStowageTypeData = segmentType === "region" ? marketData.region.map((region) => {
    const segments = marketData.stowageType.map((st) => {
      const d = marketData.stowageTypeByRegion?.[st.name]?.find(r => r.name === region.name);
      return { name: st.name, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
    });
    return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
  }) : [];

  const allCountries = segmentType === "region" ? getAllCountries() : [];

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[segmentName])
      return { title: `Countries in ${segmentName}`, data: marketData.countryDataByRegion[segmentName] };
    if (segmentType === "aircraft") return { title: "By Region", data: marketData.region };
    if (segmentType === "endUser") return { title: "By Region", data: marketData.region };
    if (segmentType === "equipment") return { title: "By Region", data: marketData.region };
    if (segmentType === "stowageType") return { title: "By Region", data: marketData.region };
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

      {segmentType === "equipment" && equipmentByRegionData.length > 0 && equipmentByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={equipmentByRegionData} year={selectedYear} title={`${labels.equipment} by Region`} subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "stowageType" && stowageTypeByRegionData.length > 0 && stowageTypeByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={stowageTypeByRegionData} year={selectedYear} title={`${labels.stowageType} by Region`} subtitle={`${selectedYear} breakdown`}
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
          {regionByEquipmentData.length > 0 && regionByEquipmentData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByEquipmentData} year={selectedYear} title={`Region by ${labels.equipment}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={equipmentNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByStowageTypeData.length > 0 && regionByStowageTypeData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByStowageTypeData} year={selectedYear} title={`Region by ${labels.stowageType}`} subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={stowageTypeNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
        </>
      )}

      <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} — Comparison`} onRowClick={handleTableRowClick} />

      <DrillDownModal isOpen={drillDownState.isOpen} onClose={closeDrillDown} segmentName={drillDownState.segmentName} segmentData={drillDownState.segmentData} color={drillDownState.color} useMillions={useMillions} />
    </div>
  );
}
