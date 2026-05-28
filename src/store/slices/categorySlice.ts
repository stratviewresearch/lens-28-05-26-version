import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardRegistry } from '@/dashboards/registry';
import { ENDPOINTS } from '@/config/api';
import { apiService } from '@/lib/apiService';

// Interfaces mapping to the PHP API responses
export interface Category {
    id: number | "all";
    name: string;
    slug?: string;
    icon?: string;
    color?: string;
    status: number;
}

export interface DashboardMeta {
    id: number | string;
    name: string;
    slug: string;
    purchased: boolean;
}

export interface SubCategory {
    id: number;
    category_slug: string;
    category_name: string;
    category_icon?: string;
    category_color?: string;
    name: string;
    slug?: string;
    total_dashboards: number;
    purchased_count: number;
    purchased: boolean;
    dashboards: DashboardMeta[];
    status: number;
}

export interface CategoryState {
    categories: Category[];
    subCategories: SubCategory[];
    allSubCategories: SubCategory[];
    isCategoriesLoading: boolean;
    isSubCategoriesLoading: boolean;
    isInitialized: boolean;
    categoriesError: string | null;
    subCategoriesError: string | null;
}

const initialState: CategoryState = {
    categories: [],
    subCategories: [],
    allSubCategories: [],
    isCategoriesLoading: false,
    isSubCategoriesLoading: false,
    isInitialized: false,
    categoriesError: null,
    subCategoriesError: null,
};

// 1. Fetch Categories
export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await apiService.get(ENDPOINTS.DASHBOARD.CATEGORIES);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data.data as Category[]; // Array of categories
            } else {
                return rejectWithValue(data.message || 'Failed to fetch categories');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 2. Fetch Subcategories (Requires category_id)
export const fetchSubCategories = createAsyncThunk(
    'categories/fetchSubCategories',
    async (categoryId: number | "all", { getState, rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.DASHBOARD.SUBCATEGORIES, { category_id: categoryId });
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                const apiSubCategories: SubCategory[] = data.data;

                // Create a deep copy to safely mutate
                const mergedSubCategories = JSON.parse(JSON.stringify(apiSubCategories)) as SubCategory[];

                // Note: We no longer auto-merge local dashboards from dashboardRegistry to ensure 
                // the database is the single source of truth for the dashboard count.
                // React routes are still resolved via activeDashboardRoutes during navigation.

                return mergedSubCategories;
            } else {
                return rejectWithValue(data.message || 'Failed to fetch subcategories');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        clearCategoryState: (state) => {
            state.categories = [];
            state.subCategories = [];
            state.allSubCategories = [];
            state.categoriesError = null;
            state.subCategoriesError = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch Categories
        builder.addCase(fetchCategories.pending, (state) => {
            state.isCategoriesLoading = true;
            state.categoriesError = null;
        });
        builder.addCase(fetchCategories.fulfilled, (state, action) => {
            state.isCategoriesLoading = false;
            state.categories = action.payload;
        });
        builder.addCase(fetchCategories.rejected, (state, action) => {
            state.isCategoriesLoading = false;
            state.categoriesError = action.payload as string;
        });

        // Fetch SubCategories
        builder.addCase(fetchSubCategories.pending, (state) => {
            state.isSubCategoriesLoading = true;
            state.subCategoriesError = null;
        });
        builder.addCase(fetchSubCategories.fulfilled, (state, action) => {
            state.isSubCategoriesLoading = false;
            state.subCategories = action.payload;
            
            // If the argument was 'all', update allSubCategories as well
            if (action.meta.arg === 'all') {
                state.allSubCategories = action.payload;
                state.isInitialized = true;
            }
        });
        builder.addCase(fetchSubCategories.rejected, (state, action) => {
            state.isSubCategoriesLoading = false;
            state.subCategoriesError = action.payload as string;
            state.subCategories = []; // Clear old data on error
            state.isInitialized = true; // Mark as initialized even on error to stop infinite loading
        });
    },
});

export const { clearCategoryState } = categorySlice.actions;
export default categorySlice.reducer;
