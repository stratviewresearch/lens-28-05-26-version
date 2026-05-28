import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCategories, fetchSubCategories } from "@/store/slices/categorySlice";
import DashboardHeader from "@/components/DashboardHeader";
import WelcomeSection from "@/components/WelcomeSection";
import SubscriptionsSection from "@/components/SubscriptionsSection";
import DatasetList from "@/components/DatasetList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import AppFooter from "@/components/AppFooter";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const dispatch = useAppDispatch();
  const { categories, allSubCategories, isCategoriesLoading, isSubCategoriesLoading } = useAppSelector(state => state.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch subcategories ('all') on mount if not already loaded
  useEffect(() => {
    if (allSubCategories.length === 0 && !isSubCategoriesLoading) {
      dispatch(fetchSubCategories('all'));
    }
  }, [dispatch, allSubCategories.length, isSubCategoriesLoading]);

  // Filter datasets locally based on active tab
  const displaySubCategories = activeTab === 'all'
    ? allSubCategories
    : allSubCategories.filter(sub => {
      const activeCat = categories.find(c => c.id.toString() === activeTab);
      if (!activeCat) return false;

      // Match by slug or name (case-insensitive)
      return (
        (activeCat.slug && sub.category_slug && activeCat.slug.toLowerCase() === sub.category_slug.toLowerCase()) ||
        (activeCat.name && sub.category_name && activeCat.name.toLowerCase() === sub.category_name.toLowerCase())
      );
    });

  // Create the dynamic tabs from Redux state
  const tabs = categories.map(cat => ({
    id: cat.id.toString(),
    label: cat.name
  }));

  const filteredDatasets = displaySubCategories.length;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />
      <WelcomeSection />

      <main className="container px-4 md:px-6 py-8">
        <SubscriptionsSection />

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Available Datasets
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse our comprehensive collection of market research datasets
          </p>
        </div>

        {isCategoriesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-lg">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mb-4 text-sm text-muted-foreground flex justify-between items-center">
              <span>Showing {filteredDatasets} dataset{filteredDatasets !== 1 ? "s" : ""}</span>
              {isSubCategoriesLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <DatasetList
                  subCategories={displaySubCategories}
                  isLoading={isSubCategoriesLoading}
                  categories={categories}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <AppFooter />
    </div>
  );
};

export default Dashboard;
