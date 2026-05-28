/**
 * Segment Detail Tab — self-contained for this dashboard.
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
  const { useMillions } = config;

  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];
  const valueFirstTotal = segmentData.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === cagrStartYear)?.value ?? 0), 0);
  const valueLastTotal = segmentData.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === lastYear)?.value ?? 0), 0);
  const cagr = calculateCAGR(valueFirstTotal, valueLastTotal, lastYear - cagrStartYear);

  const regionNames = marketData.region.map((s) => s.name);

  const getAllCountries = (): SegmentData[] => {
    const all: SegmentData[] = [];
    Object.values(marketData.countryDataByRegion).forEach((c) => all.push(...c));
    return all;
  };

  const buildByRegionData = (nestedData: Record<string, SegmentData[]> | undefined, parentSegments: SegmentData[]) => {
    if (!nestedData || Object.keys(nestedData).length === 0) return [];
    return parentSegments.map((parent) => {
      const segments = nestedData[parent.name] || [];
      const total = segments.reduce((sum, seg) => sum + (seg.data.find((d) => d.year === selectedYear)?.value ?? 0), 0);
      return { name: parent.name, segments: segments.map((seg) => ({ name: seg.name, value: seg.data.find((d) => d.year === selectedYear)?.value ?? 0, fullData: seg.data })), total };
    });
  };

  // Reverse cross-tab: for region tab, show region × other segments
  const buildRegionBySegment = (segmentNames: string[], crossTabData: Record<string, SegmentData[]>) => {
    return marketData.region.map((region) => {
      const segments = segmentNames.map((segName) => {
        const d = crossTabData?.[segName]?.find(r => r.name === region.name);
        return { name: segName, value: d?.data.find(dd => dd.year === selectedYear)?.value ?? 0, fullData: d?.data || [] };
      });
      return { name: region.name, segments, total: segments.reduce((s, seg) => s + seg.value, 0) };
    });
  };

  // Build stacked bars per segment type
  const aircraftByRegionData = segmentType === "aircraft" ? buildByRegionData(marketData.aircraftTypeByRegion, marketData.aircraftType) : [];
  const applicationByRegionData = segmentType === "application" ? buildByRegionData(marketData.applicationByRegion, marketData.application) : [];
  const fastenerByRegionData = segmentType === "fastener" ? buildByRegionData(marketData.fastenerTypeByRegion, marketData.fastenerType) : [];
  const materialByRegionData = segmentType === "material" ? buildByRegionData(marketData.materialTypeByRegion, marketData.materialType) : [];
  const coreMaterialByRegionData = segmentType === "coreMaterial" ? buildByRegionData(marketData.coreMaterialTypeByRegion, marketData.coreMaterialType) : [];
  const salesChannelByRegionData = segmentType === "salesChannel" ? buildByRegionData(marketData.salesChannelByRegion, marketData.salesChannel) : [];

  // Region tab cross-tabs
  const regionByAircraftData = segmentType === "region" ? buildRegionBySegment(marketData.aircraftType.map(s => s.name), marketData.aircraftTypeByRegion) : [];
  const regionByApplicationData = segmentType === "region" ? buildRegionBySegment(marketData.application.map(s => s.name), marketData.applicationByRegion) : [];
  const regionByMaterialData = segmentType === "region" ? buildRegionBySegment(marketData.materialType.map(s => s.name), marketData.materialTypeByRegion) : [];
  const regionByCoreMaterialData = segmentType === "region" ? buildRegionBySegment(marketData.coreMaterialType.map(s => s.name), marketData.coreMaterialTypeByRegion) : [];
  const regionBySalesChannelData = segmentType === "region" ? buildRegionBySegment(marketData.salesChannel.map(s => s.name), marketData.salesChannelByRegion) : [];

  const allCountries = segmentType === "region" ? getAllCountries() : [];

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[segmentName])
      return { title: `Countries in ${segmentName}`, data: marketData.countryDataByRegion[segmentName] };
    return { title: "By Region", data: marketData.region };
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

      {segmentType === "aircraft" && aircraftByRegionData.length > 0 && aircraftByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={aircraftByRegionData} year={selectedYear} title="Aircraft Type by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "application" && applicationByRegionData.length > 0 && applicationByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={applicationByRegionData} year={selectedYear} title="Application Type by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "fastener" && fastenerByRegionData.length > 0 && fastenerByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={fastenerByRegionData} year={selectedYear} title="Fastener Type by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "material" && materialByRegionData.length > 0 && materialByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={materialByRegionData} year={selectedYear} title="Material Type by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "coreMaterial" && coreMaterialByRegionData.length > 0 && coreMaterialByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={coreMaterialByRegionData} year={selectedYear} title="Core Material Type by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "salesChannel" && salesChannelByRegionData.length > 0 && salesChannelByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={salesChannelByRegionData} year={selectedYear} title="Sales Channel by Region" subtitle={`${selectedYear} breakdown`}
          segmentColors={CHART_COLORS} segmentNames={regionNames} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "region" && (
        <>
          {regionByAircraftData.length > 0 && regionByAircraftData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByAircraftData} year={selectedYear} title="Region by Aircraft Type" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={marketData.aircraftType.map(s => s.name)} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByApplicationData.length > 0 && regionByApplicationData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByApplicationData} year={selectedYear} title="Region by Application Type" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={marketData.application.map(s => s.name)} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByMaterialData.length > 0 && regionByMaterialData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByMaterialData} year={selectedYear} title="Region by Material Type" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={marketData.materialType.map(s => s.name)} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionByCoreMaterialData.length > 0 && regionByCoreMaterialData.some(d => d.total > 0) && (
            <StackedBarChart data={regionByCoreMaterialData} year={selectedYear} title="Region by Core Material Type" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={marketData.coreMaterialType.map(s => s.name)} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
          {regionBySalesChannelData.length > 0 && regionBySalesChannelData.some(d => d.total > 0) && (
            <StackedBarChart data={regionBySalesChannelData} year={selectedYear} title="Region by Sales Channel" subtitle={`${selectedYear} breakdown`}
              segmentColors={CHART_COLORS} segmentNames={marketData.salesChannel.map(s => s.name)} onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
          )}
        </>
      )}

      <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear} title={`${title} — Comparison`} onRowClick={handleTableRowClick} />

      <DrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={closeDrillDown}
        segmentName={drillDownState.segmentName}
        segmentData={drillDownState.segmentData}
        color={drillDownState.color}
        useMillions={useMillions}
      />
    </div>
  );
}
