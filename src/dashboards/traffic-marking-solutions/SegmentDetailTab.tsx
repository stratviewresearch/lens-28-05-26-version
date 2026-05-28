/**
 * Segment Detail Tab — Traffic Marking Solutions.
 * Handles tabs: productType, application, region.
 */

import { KPICard } from "./ui-helpers";
import { MarketTrendChart, SegmentPieChart, ComparisonTable, DrillDownModal, StackedBarChart, CHART_COLORS } from "./charts";
import { YearlyData, SegmentData, MarketData, useDrillDown } from "./data";
import { config, TabType } from "./config";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { calculateCAGR } from "./data";

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

  const currentRunningYear = new Date().getFullYear() - 1;
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const lastYear = marketData.years[marketData.years.length - 1];

  const segCurrentTotal = segmentData.reduce((s, seg) => s + (seg.data.find(d => d.year === selectedYear)?.value ?? 0), 0);
  const segCagrFirst = segmentData.reduce((s, seg) => s + (seg.data.find(d => d.year === cagrStartYear)?.value ?? 0), 0);
  const segCagrLast = segmentData.reduce((s, seg) => s + (seg.data.find(d => d.year === lastYear)?.value ?? 0), 0);
  const segCagr = calculateCAGR(segCagrFirst, segCagrLast, lastYear - cagrStartYear);

  const regionNames = marketData.region.map(s => s.name);

  // Build forward stacked bars
  const buildForward = (parents: SegmentData[], nested: Record<string, SegmentData[]>) => {
    if (!nested || Object.keys(nested).length === 0) return [];
    return parents.map(parent => {
      const segs = nested[parent.name] || [];
      const segments = segs.map(s => ({
        name: s.name, value: s.data.find(d => d.year === selectedYear)?.value ?? 0, fullData: s.data,
      }));
      return { name: parent.name, segments, total: segments.reduce((a, b) => a + b.value, 0) };
    });
  };

  // Invert nested map: { parent: [{name:region, data}] } -> for each region, segments per parent
  const buildInverted = (parents: SegmentData[], nested: Record<string, SegmentData[]>) => {
    if (!nested || Object.keys(nested).length === 0) return [];
    return marketData.region.map(region => {
      const segments = parents.map(parent => {
        const entry = nested[parent.name]?.find(r => r.name.toLowerCase() === region.name.toLowerCase());
        return {
          name: parent.name,
          value: entry?.data.find(d => d.year === selectedYear)?.value ?? 0,
          fullData: entry?.data ?? [],
        };
      });
      return { name: region.name, segments, total: segments.reduce((a, b) => a + b.value, 0) };
    });
  };

  const productByRegionData = segmentType === "productType" ? buildForward(marketData.productType, marketData.productByRegion) : [];
  const applicationByRegionData = segmentType === "application" ? buildForward(marketData.application, marketData.applicationByRegion) : [];

  const regionByProductData = segmentType === "region" ? buildInverted(marketData.productType, marketData.productByRegion) : [];
  const regionByApplicationData = segmentType === "region" ? buildInverted(marketData.application, marketData.applicationByRegion) : [];

  const allCountries = segmentType === "region"
    ? Object.values(marketData.countryDataByRegion).flat()
    : [];

  const productNames = marketData.productType.map(s => s.name);
  const applicationNames = marketData.application.map(s => s.name);

  const getRelatedSegmentsForDrillDown = (segmentName: string) => {
    if (segmentType === "region" && marketData.countryDataByRegion[segmentName])
      return { title: `Countries in ${segmentName}`, data: marketData.countryDataByRegion[segmentName] };
    if (segmentType === "productType") return { title: "By Region", data: marketData.region };
    if (segmentType === "application") return { title: "By Region", data: marketData.region };
    return undefined;
  };

  const handlePieSegmentClick = (name: string, data: YearlyData[], color: string) =>
    openDrillDown(name, data, color, getRelatedSegmentsForDrillDown(name));
  const handleTrendSegmentClick = handlePieSegmentClick;
  const handleTableRowClick = handlePieSegmentClick;
  const handleStackedBarClick = (_p: string, segmentName: string, _v: number, color: string, fullData?: YearlyData[]) => {
    if (fullData) openDrillDown(segmentName, fullData, color);
  };

  return (
    <div className="space-y-8">
      {segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPICard title={`${selectedYear} ${title} Total`} value={useMillions ? segCurrentTotal : segCurrentTotal / 1000} suffix={useMillions ? "M" : "B"} icon={DollarSign} delay={0} accentColor="primary" />
          <KPICard title={`${lastYear} Forecast`} value={useMillions ? segCagrLast : segCagrLast / 1000} suffix={useMillions ? "M" : "B"} icon={TrendingUp} delay={0.1} accentColor="accent" />
          <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={segCagr} prefix="" suffix="%" icon={BarChart3} delay={0.2} accentColor="chart-4" />
        </div>
      )}

      {segmentData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendChart data={totalMarket} segments={segmentData} title={`${title} - Market Trend`}
              subtitle="Historical and forecast data - Click legend to drill down" showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} />
          </div>
          <SegmentPieChart data={segmentData} year={selectedYear} title={title} onSegmentClick={handlePieSegmentClick} />
        </div>
      )}

      {segmentType === "productType" && productByRegionData.length > 0 && productByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={productByRegionData} year={selectedYear} title={`${labels.productType} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames}
          onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "application" && applicationByRegionData.length > 0 && applicationByRegionData.some(d => d.total > 0) && (
        <StackedBarChart data={applicationByRegionData} year={selectedYear} title={`${labels.application} by Region`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={regionNames}
          onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "region" && allCountries.length > 0 && (
        <MarketTrendChart data={totalMarket} segments={allCountries} title="Countries - Market Trend"
          subtitle="All countries historical and forecast data - Click legend to drill down"
          showSegments onSegmentClick={handleTrendSegmentClick} useMillions={useMillions} />
      )}

      {segmentType === "region" && regionByProductData.length > 0 && regionByProductData.some(d => d.total > 0) && (
        <StackedBarChart data={regionByProductData} year={selectedYear} title={`Region by ${labels.productType}`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={productNames}
          onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentType === "region" && regionByApplicationData.length > 0 && regionByApplicationData.some(d => d.total > 0) && (
        <StackedBarChart data={regionByApplicationData} year={selectedYear} title={`Region by ${labels.application}`}
          subtitle={`${selectedYear} breakdown`} segmentColors={CHART_COLORS} segmentNames={applicationNames}
          onSegmentClick={handleStackedBarClick} useMillions={useMillions} />
      )}

      {segmentData.length > 0 && (
        <ComparisonTable data={segmentData} startYear={cagrStartYear} endYear={lastYear}
          title={`${title} — Comparison`} onRowClick={handleTableRowClick} />
      )}

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
