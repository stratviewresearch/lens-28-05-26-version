/**
 * Company Share Tab — Traffic Marking Solutions Market.
 * Single-year (2025) company market share analysis.
 */

import { motion } from "framer-motion";
import { Award, Users, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { KPICard } from "./ui-helpers";
import { CHART_COLORS } from "./charts";
import { MarketData } from "./data";

interface CompanyShareTabProps {
  marketData: MarketData;
}

export function CompanyShareTab({ marketData }: CompanyShareTabProps) {
  const { companyShare, companyShareYear } = marketData;

  if (!companyShare.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No company share data available.
      </div>
    );
  }

  const sorted = [...companyShare].sort((a, b) => {
    if (a.name.toLowerCase() === "others") return 1;
    if (b.name.toLowerCase() === "others") return -1;
    return b.share - a.share;
  });

  const named = sorted.filter(c => c.name.toLowerCase() !== "others");
  const leader = named[0] ?? sorted[0];
  const top4Concentration = named.slice(0, 4).reduce((s, c) => s + c.share, 0);
  const others = sorted.find(c => c.name.toLowerCase() === "others")?.share ?? 0;

  const pieData = sorted.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
          <p className="font-semibold text-foreground">{d.payload.name}</p>
          <p className="text-sm text-muted-foreground">Share: <span className="font-mono font-medium text-foreground">{d.value.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title={`Market Leader (${companyShareYear})`} value={leader.share} prefix={`${leader.name} — `} suffix="%" decimals={1} icon={Award} delay={0} accentColor="primary" />
        <KPICard title="Top-4 Concentration" value={top4Concentration} prefix="" suffix="%" decimals={1} icon={Users} delay={0.1} accentColor="chart-4" />
        <KPICard title="Others / Fragmented" value={others} prefix="" suffix="%" decimals={1} icon={PieChartIcon} delay={0.2} accentColor="accent" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-xl border border-border bg-card p-3 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Company Market Share</h3>
            <p className="text-sm text-muted-foreground">{companyShareYear} distribution (%)</p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2}
                  dataKey="share" stroke="hsl(222, 47%, 6%)" strokeWidth={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
                <span className="text-xs font-mono text-foreground">{entry.share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Note: Company share data reflects {companyShareYear} only. The year selector is hidden on this tab.
      </div>
    </div>
  );
}
