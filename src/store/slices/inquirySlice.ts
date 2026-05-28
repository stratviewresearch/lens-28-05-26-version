import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '@/config/api';
import { apiService } from '@/lib/apiService';

export interface InquiryPayload {
    user_id?: number;
    dashboard_slug: string;
    message: string;
    type: 'access_request' | 'subscription_inquires' | 'query_form';
}

export interface InquiryState {
    isLoading: boolean;
    isSuccess: boolean;
    error: string | null;
}

const initialState: InquiryState = {
    isLoading: false,
    isSuccess: false,
    error: null,
};

export const submitInquiry = createAsyncThunk(
    'inquiry/submitInquiry',
    async (payload: InquiryPayload, { getState, rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.DASHBOARD.INQUIRY, payload);

            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data;
            } else {
                return rejectWithValue(data.message || 'Failed to submit inquiry');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

const inquirySlice = createSlice({
    name: 'inquiry',
    initialState,
    reducers: {
        resetInquiryState: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(submitInquiry.pending, (state) => {
            state.isLoading = true;
            state.isSuccess = false;
            state.error = null;
        });
        builder.addCase(submitInquiry.fulfilled, (state) => {
            state.isLoading = false;
            state.isSuccess = true;
            state.error = null;
        });
        builder.addCase(submitInquiry.rejected, (state, action) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.error = action.payload as string;
        });
    },
});

export const { resetInquiryState } = inquirySlice.actions;
export default inquirySlice.reducer;
