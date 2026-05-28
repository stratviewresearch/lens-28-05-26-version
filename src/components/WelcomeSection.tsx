import { TrendingUp, Database, BarChart3 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

const WelcomeSection = () => {
  const { user } = useAppSelector((state) => state.auth);
  const stats = [
    { icon: Database, label: "Datasets", value: "24+" },
    { icon: BarChart3, label: "Dashboards", value: "150+" },
    { icon: TrendingUp, label: "Data Points", value: "1M+" },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero py-8 md:py-12 px-4 md:px-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto flex flex-col items-center text-center gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground font-display">
            Welcome back, {user?.name?.split(" ")[0] || "Guest"}
          </h1>
          <p className="text-primary-foreground/70 max-w-lg mx-auto">
            Access comprehensive market research data across industries.
            Explore datasets and interactive dashboards below.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 w-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-3 md:p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10"
            >
              <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-accent mb-1.5 md:mb-2" />
              <span className="text-lg md:text-2xl font-bold text-primary-foreground font-display">
                {stat.value}
              </span>
              <span className="text-[10px] md:text-xs text-primary-foreground/60">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
