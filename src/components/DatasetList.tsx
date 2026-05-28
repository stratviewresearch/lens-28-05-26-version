import { useNavigate } from "react-router-dom";
import { SubCategory, Category } from "@/store/slices/categorySlice";
import DynamicIcon from "./DynamicIcon";
import { getCategoryIconStyles } from "@/config/colors";
import { ChevronRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DatasetListProps {
  subCategories: SubCategory[];
  isLoading: boolean;
  categories: Category[];
}

const DatasetList = ({ subCategories, isLoading, categories }: DatasetListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((skeleton) => (
          <div key={skeleton} className="h-[90px] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (subCategories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
        No datasets found for this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {subCategories.map((dataset, index) => {
        // ROBUST LOOKUP: Find parent category by slug (case-insensitive) OR name (case-insensitive)
        const parentCategory = categories.find(cat =>
          (cat.slug && dataset.category_slug && cat.slug.toLowerCase() === dataset.category_slug.toLowerCase()) ||
          (cat.name && dataset.category_name && cat.name.toLowerCase() === dataset.category_name.toLowerCase())
        );

        const displayIcon = parentCategory?.icon || dataset.category_icon;
        const displayColor = parentCategory?.color || dataset.category_color;

        const isLocked = !dataset.purchased;
        const iconStyles = getCategoryIconStyles(displayColor);

        return (
          <Card
            key={dataset.id}
            onClick={() => navigate(`/dataset/${dataset.slug}`)}
            className="group cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 animate-fade-in-up"
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
                      {dataset.total_dashboards} dashboards
                    </span>
                  </div>
                </div>
                {isLocked ? (
                  <Lock className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DatasetList;
