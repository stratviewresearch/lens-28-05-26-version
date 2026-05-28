import React, { Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSubCategories } from "@/store/slices/categorySlice";
import { dashboardRegistry } from "@/dashboards/registry";
import { useEffect } from "react";

interface DashboardGuardProps {
    children: React.ReactNode;
    routePath: string;
}

const DashboardGuard: React.FC<DashboardGuardProps> = ({ children, routePath }) => {
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const { subCategories, isSubCategoriesLoading, isInitialized } = useAppSelector((state) => state.categories);
    const location = useLocation();

    // Data is fetched globally in App.tsx to avoid infinite loops and redundancy

    // 2. Check Authentication
    if (!isAuthenticated) {
        return <Navigate to="/?open_login=true" state={{ from: location }} replace />;
    }

    // 3. If loading OR state is not yet initialized, show spinner
    // We MUST wait for subCategories to be populated to verify purchase
    if (isSubCategoriesLoading || !isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground animate-pulse">Verifying access...</p>
                </div>
            </div>
        );
    }

    // 4. Find the dashboard configuration from the registry
    const registryEntry = dashboardRegistry.find((entry) => entry.routePath === routePath);
    if (!registryEntry) return <>{children}</>;

    // 5. Verify purchase status
    const isPurchased = registryEntry.catalogs.some((catalog) => {
        return subCategories.some((sub) =>
            sub.dashboards.some((dash) => dash.slug === catalog.dashboardId && dash.purchased)
        );
    });

    // 6. Final authorization check
    if (!isPurchased) {
        console.warn(`Unauthorized access attempt to ${routePath} by user ${user?.id}`);
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground animate-pulse">Verifying access...</p>
                </div>
            </div>
        }>
            {children}
        </Suspense>
    );
};

export default DashboardGuard;
