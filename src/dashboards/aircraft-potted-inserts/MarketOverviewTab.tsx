/**
 * Market Overview Tab — self-contained for this dashboard.
 */

import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { KPICard } from "./ui-helpers";
import { MarketOverviewChart, DrillDownModal, SegmentPieChart, CHART_COLORS } from "./charts";
import { MarketData, calculateCAGR, SegmentData, YearlyData, useDrillDown } from "./data";
import { config, TabType } from "./config";
import { motion } from "framer-motion";

interface MarketOverviewTabProps {
  marketData: MarketData;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onNavigateToTab: (tabType: TabType) => void;
}

interface MiniDonutProps {
  data: SegmentData[];
  year: number;
  title: string;
  tabType: TabType;
  onClick?: (tabType: TabType) => void;
  onSliceClick?: (segmentName: string, segmentData: YearlyData[], color: string, donutType: TabType) => void;
  delay: number;
}

function MiniDonut({ data, year, title, tabType, onClick, onSliceClick, delay }: MiniDonutProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const pieData = data.map((segment, index) => ({
    name: segment.name,
    value: segment.data.find((d) => d.year === year)?.value ?? 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
    fullData: segment.data,
  }));
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const handlePieClick = (_data: any, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const segment = pieData[index];
    if (segment && onSliceClick) onSliceClick(segment.name, segment.fullData, segment.color, tabType);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay }} onClick={() => onClick?.(tabType)} className="rounded-xl border border-border bg-card p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
      <h4 className="text-sm font-medium text-foreground text-center mb-2">{title}</h4>
      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="hsl(222, 47%, 6%)" strokeWidth={1}
              activeIndex={activeIndex} activeShape={renderActiveDonutShape}
              onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(undefined)}
              onClick={handlePieClick} style={{ cursor: "pointer" }}>
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div className="rounded-lg border border-border bg-popover p-2 shadow-lg text-xs">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-muted-foreground">${item.value.toLocaleString()}M ({percentage}%)</p>
                    <p className="text-primary text-[10px] mt-1">Click to drill down</p>
                  </div>
                );
              }
              return null;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {pieData.slice(0, 3).map((entry, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[10px] text-muted-foreground truncate max-w-[50px]">{entry.name}</span>
          </div>
        ))}
        {pieData.length > 3 && <span className="text-[10px] text-muted-foreground">+{pieData.length - 3}</span>}
      </div>
    </motion.div>
  );
}

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";

const renderActiveDonutShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g><Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} style={{ filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))", cursor: "pointer" }} /></g>
  );
};

export function MarketOverviewTab({ marketData, selectedYear, onNavigateToTab }: MarketOverviewTabProps) {
  const { drillDownState, openDrillDown, closeDrillDown } = useDrillDown();
  const { useMillions } = config;

  const lastYear = marketData.years[marketData.years.length - 1];
  const currentRunningYear = new Date().getFullYear();
  const cagrStartYear = marketData.years.includes(currentRunningYear) ? currentRunningYear : marketData.years[0];
  const currentMarketValue = marketData.totalMarket.find((d) => d.year === selectedYear)?.value ?? 0;
  const valueFirst = marketData.totalMarket.find((d) => d.year === cagrStartYear)?.value ?? 0;
  const valueLast = marketData.totalMarket.find((d) => d.year === lastYear)?.value ?? 0;
  const cagrValue = calculateCAGR(valueFirst, valueLast, lastYear - cagrStartYear);

  const handleSliceClick = (segmentName: string, segmentData: YearlyData[], color: string, _donutType: TabType) => {
    openDrillDown(segmentName, segmentData, color, { title: "By Region", data: marketData.region });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title={`${selectedYear} Market Size`} value={useMillions ? currentMarketValue : currentMarketValue / 1000} suffix={useMillions ? "M" : "B"} icon={DollarSign} delay={0} accentColor="primary" />
        <KPICard title={`CAGR (${cagrStartYear}-${lastYear})`} value={cagrValue} prefix="" suffix="%" icon={BarChart3} delay={0.1} accentColor="chart-4" />
        <KPICard title={`${lastYear} Forecast`} value={useMillions ? valueLast : valueLast / 1000} suffix={useMillions ? "M" : "B"} icon={TrendingUp} delay={0.2} accentColor="accent" />
      </div>

      <MarketOverviewChart
        data={marketData.totalMarket}
        title="Market Size & YoY Growth Trend"
        subtitle={`${marketData.years[0]}-${lastYear} data`}
        useMillions={useMillions}
      />

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">{selectedYear} Market Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Click any slice to see detailed analysis</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <MiniDonut data={marketData.aircraftType} year={selectedYear} title="Aircraft Type" tabType="aircraft" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.1} />
          <MiniDonut data={marketData.region} year={selectedYear} title="Region" tabType="region" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.15} />
          <MiniDonut data={marketData.application} year={selectedYear} title="Application Type" tabType="application" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.2} />
          <MiniDonut data={marketData.fastenerType} year={selectedYear} title="Fastener Type" tabType="fastener" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.25} />
          <MiniDonut data={marketData.materialType} year={selectedYear} title="Material Type" tabType="material" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.3} />
          <MiniDonut data={marketData.coreMaterialType} year={selectedYear} title="Core Material Type" tabType="coreMaterial" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.35} />
          <MiniDonut data={marketData.salesChannel} year={selectedYear} title="Sales Channel" tabType="salesChannel" onClick={onNavigateToTab} onSliceClick={handleSliceClick} delay={0.4} />
        </div>
      </div>

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
