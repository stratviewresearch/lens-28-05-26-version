import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { ChevronRight, Package, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DynamicIcon from "./DynamicIcon";
import { getCategoryIconStyles } from "@/config/colors";

const SubscriptionsSection = () => {
  const navigate = useNavigate();
  const { allSubCategories, categories, isSubCategoriesLoading } = useAppSelector(state => state.categories);
  const { subscriptions, isLoading: isSubscriptionsLoading } = useAppSelector(state => state.subscriptions);
  
  const hasMasterAccess = (subscriptions || []).some(s => s.grant_type === 'master_access');

  const subscribedDatasets = hasMasterAccess 
    ? (allSubCategories || [])
    : (allSubCategories || []).filter((sub) => {
        // A dataset is "subscribed" if it has at least one dashboard in the subscriptions list
        return (subscriptions || []).some(s => 
          (s.subcategory_slug && sub.slug && s.subcategory_slug === sub.slug) ||
          (s.subcategory_name && sub.name && s.subcategory_name === sub.name)
        );
      });

  if ((isSubCategoriesLoading || isSubscriptionsLoading) && allSubCategories.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Your Subscriptions
        </h2>
        <p className="text-sm text-muted-foreground">
          Quick access to your purchased datasets
        </p>
      </div>

      {subscribedDatasets.length === 0 ? (
        <Alert className="bg-muted/50 border-muted">
          <Package className="h-4 w-4" />
          <AlertDescription>
            You haven't subscribed to any dataset yet. Check out all datasets below to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {subscribedDatasets.map((dataset, index) => {
            // ROBUST LOOKUP: Find parent category by slug (case-insensitive) OR name (case-insensitive)
            const parentCategory = categories.find(cat => 
              (cat.slug && dataset.category_slug && cat.slug.toLowerCase() === dataset.category_slug.toLowerCase()) ||
              (cat.name && dataset.category_name && cat.name.toLowerCase() === dataset.category_name.toLowerCase())
            );
            
            const displayIcon = parentCategory?.icon || dataset.category_icon;
            const displayColor = parentCategory?.color || dataset.category_color;
            
            const iconStyles = getCategoryIconStyles(displayColor);

            return (
              <Card
                key={dataset.id}
                onClick={() => navigate(`/dataset/${dataset.slug}`)}
                className="group cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 animate-fade-in-up border-primary/20 bg-primary/5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105`}
                      style={iconStyles}
                    >
                      <DynamicIcon name={displayIcon} className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                        {dataset.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {dataset.category_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dataset.purchased_count} of {dataset.total_dashboards} unlocked
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SubscriptionsSection;
