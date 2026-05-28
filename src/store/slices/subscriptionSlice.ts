import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '@/config/api';
import { apiService } from '@/lib/apiService';

export interface Subscription {
    dashboard_id: number | string;
    dashboard_name: string;
    dashboard_slug: string;
    category_name: string;
    subcategory_name: string;
    subcategory_slug?: string;
    valid_from: string;
    valid_to: string;
    active: boolean;
    is_trial?: boolean;
    type?: string;
    grant_type?: string;
    url?: string;
}

export interface SubscriptionState {
    subscriptions: Subscription[];
    isLoading: boolean;
    error: string | null;
    inquiryStatus: 'idle' | 'loading' | 'success' | 'failed';
}

const initialState: SubscriptionState = {
    subscriptions: [],
    isLoading: false,
    error: null,
    inquiryStatus: 'idle',
};

// 1. Fetch User Subscriptions
export const fetchSubscriptions = createAsyncThunk(
    'subscriptions/fetchSubscriptions',
    async (userId: number, { getState, rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.DASHBOARD.SUBSCRIPTIONS, { user_id: userId });
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data.data; // Array of subscriptions
            } else {
                return rejectWithValue(data.message || 'Failed to fetch subscriptions');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 2. Submit Inquiry
export const submitInquiry = createAsyncThunk(
    'subscriptions/submitInquiry',
    async (inquiryData: { 
        user_id?: number; 
        dashboard_slug: string; 
        message: string; 
        type: 'access_request' | 'subscription_inquires' | 'query_form' 
    }, { getState, rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.DASHBOARD.INQUIRY, inquiryData);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data.data;
            } else {
                return rejectWithValue(data.message || 'Inquiry submission failed');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

const subscriptionSlice = createSlice({
    name: 'subscriptions',
    initialState,
    reducers: {
        resetInquiryStatus: (state) => {
            state.inquiryStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        // Fetch Subscriptions
        builder.addCase(fetchSubscriptions.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchSubscriptions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.subscriptions = action.payload;
        });
        builder.addCase(fetchSubscriptions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Submit Inquiry
        builder.addCase(submitInquiry.pending, (state) => {
            state.inquiryStatus = 'loading';
        });
        builder.addCase(submitInquiry.fulfilled, (state) => {
            state.inquiryStatus = 'success';
        });
        builder.addCase(submitInquiry.rejected, (state) => {
            state.inquiryStatus = 'failed';
        });
    },
});

export const { resetInquiryStatus } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
