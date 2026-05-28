import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import AccessRequestDialog from "@/components/AccessRequestDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSubCategories, fetchCategories } from "@/store/slices/categorySlice";
import { activeDashboardRoutes } from "@/data/dashboardRoutes";
import AppFooter from "@/components/AppFooter";
import DynamicIcon from "@/components/DynamicIcon";
import { getCategoryIconStyles } from "@/config/colors";

const DatasetDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDashboardSlug, setSelectedDashboardSlug] = useState("");

  // Read subCategories and categories from Redux state
  const { allSubCategories: subCategories, categories, isSubCategoriesLoading, isCategoriesLoading } = useAppSelector((state) => state.categories);

  // Trigger fetch if empty (handles page refresh)
  useEffect(() => {
    if (categories.length === 0 && !isCategoriesLoading) {
      dispatch(fetchCategories());
    }
    if (subCategories.length === 0 && !isSubCategoriesLoading) {
      dispatch(fetchSubCategories("all"));
    }
  }, [subCategories.length, categories.length, isSubCategoriesLoading, isCategoriesLoading, dispatch]);

  // Find the dataset (subCategory) in the Redux state
  const dataset = subCategories.find((d) => d.slug === slug);

  // ROBUST LOOKUP: Find parent category by slug (case-insensitive) OR name (case-insensitive)
  const parentCategory = categories.find(cat =>
    (cat.slug && dataset?.category_slug && cat.slug.toLowerCase() === dataset.category_slug.toLowerCase()) ||
    (cat.name && dataset?.category_name && cat.name.toLowerCase() === dataset.category_name.toLowerCase())
  );

  const displayIcon = parentCategory?.icon || dataset?.category_icon;
  const displayColor = parentCategory?.color || dataset?.category_color;

  if ((isSubCategoriesLoading || isCategoriesLoading) && !dataset) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container px-4 md:px-6 py-32 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading dataset details...</p>
        </div>
      </div>
    );
  }


  if (!dataset) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container px-4 md:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Dataset Not Found</h1>
          <p className="text-muted-foreground mb-6">The dataset you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

  const purchasedCount = dataset.dashboards.filter((d) => d.purchased).length;
  const iconStyles = getCategoryIconStyles(displayColor);

  const handleDashboardClick = (dashboard: { slug: string; purchased: boolean }) => {
    if (!dashboard.purchased) {
      setSelectedDashboardSlug(dashboard.slug);
      setDialogOpen(true);
      return;
    }

    const route = activeDashboardRoutes[dashboard.slug as keyof typeof activeDashboardRoutes];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />

      <section className="relative overflow-hidden gradient-hero py-8 md:py-10 px-4 md:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="container relative z-10 px-0">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Datasets
          </Button>
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className={`flex h-11 w-11 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md shadow-xl`}
              style={{ color: iconStyles.color }}
            >
              <DynamicIcon name={displayIcon} className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-primary-foreground font-display break-words">
                {dataset.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary-foreground/10 text-primary-foreground/80 border-0 text-xs">
                  {dataset.category_name}
                </Badge>
                {!dataset.purchased && (
                  <Badge variant="secondary" className="bg-destructive/20 text-primary-foreground/90 border-0 text-xs">
                    <Lock className="h-3 w-3 mr-1" /> Not Purchased
                  </Badge>
                )}
                <span className="text-xs md:text-sm text-primary-foreground/60">
                  {purchasedCount} of {dataset.dashboards.length} dashboard{dataset.dashboards.length !== 1 ? "s" : ""} unlocked
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container px-4 md:px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">Available Dashboards</h2>
          <p className="text-sm text-muted-foreground">
            {(purchasedCount > 0)
              ? "Select an unlocked dashboard to explore detailed market insights"
              : "These dashboards are available with this dataset. Submit a request to get access."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...dataset.dashboards]
            .sort((a, b) => (a.purchased === b.purchased ? 0 : a.purchased ? -1 : 1))
            .map((dashboard, index) => {
              const isDashboardPurchased = dashboard.purchased;
              const isActive = isDashboardPurchased && !!activeDashboardRoutes[dashboard.slug as keyof typeof activeDashboardRoutes];
              return (
                <motion.div
                  key={dashboard.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                >
                  <Card
                    onClick={() => handleDashboardClick(dashboard)}
                    className={`group transition-all duration-300 ${!isDashboardPurchased
                      ? "cursor-pointer opacity-75 hover:opacity-100 hover:shadow-card-hover"
                      : isActive
                        ? "cursor-pointer hover:shadow-card-hover hover:border-primary/30"
                        : "opacity-60 cursor-not-allowed"
                      }`}
                  >
                    <CardContent className="p-4 md:p-5">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div
                          className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/5 transition-colors group-hover:bg-primary/10"
                          style={{ backgroundColor: `${iconStyles.color}15`, color: iconStyles.color }}
                        >
                          <DynamicIcon name={displayIcon} className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm md:text-base transition-colors truncate ${!isDashboardPurchased
                            ? "text-muted-foreground group-hover:text-foreground"
                            : isActive
                              ? "text-card-foreground group-hover:text-primary"
                              : "text-muted-foreground"
                            }`}
                            style={iconStyles.color ? { '--hover-color': iconStyles.color } as any : {}}
                          >
                            {dashboard.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {!isDashboardPurchased ? "Access required" : isActive ? "Interactive market dashboard" : "Coming soon"}
                          </p>
                        </div>
                        {!isDashboardPurchased ? (
                          <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        ) : isActive ? (
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </div>
      </main>

      <AppFooter />

      <AccessRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        datasetName={dataset.name}
        dashboardSlug={selectedDashboardSlug}
      />
    </div>
  );
};

export default DatasetDetail;
