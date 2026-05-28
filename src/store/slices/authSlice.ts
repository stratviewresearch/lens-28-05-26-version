import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ENDPOINTS } from '@/config/api';
import { apiService } from '@/lib/apiService';

// Define the shape of our User and Auth state
export interface User {
    id: number;
    name: string;
    email: string;
    company?: string;
    designation?: string;
    phone_number?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isUpdatingProfile: boolean;
    error: string | null;
}

// Initial state, trying to rehydrate from localStorage if possible
const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    isUpdatingProfile: false,
    error: null,
};

// --- Async Thunks for API calls ---

// 1. Login
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.AUTH.LOGIN, credentials);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                const user = {
                    id: data.data.id,
                    name: data.data.name,
                    email: data.data.email,
                    company: data.data.company,
                    designation: data.data.designation,
                    phone_number: data.data.phone_number
                };
                // Save to local storage for persistence
                localStorage.setItem('token', data.data.access_token);
                localStorage.setItem('user', JSON.stringify(user));
                return data;
            } else {
                return rejectWithValue(data.message || 'Login failed');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 1.1 Fetch current user profile (Me)
export const fetchMe = createAsyncThunk(
    'auth/fetchMe',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state: any = getState();
            const token = state.auth.token;
            if (!token) return rejectWithValue('No token found');

            const response = await apiService.get(ENDPOINTS.AUTH.ME);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                const currentUser = (getState() as any).auth.user;
                const updatedUser = { ...currentUser, ...data.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser as User;
            } else {
                return rejectWithValue(data.message || 'Failed to fetch user data');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 1.2 Update Profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (profileData: Partial<User>, { getState, rejectWithValue }) => {
        try {
            const state: any = getState();
            const token = state.auth.token;

            const response = await apiService.post(ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                const currentUser = (getState() as any).auth.user;
                const updatedUser = { ...currentUser, ...data.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser as User;
            } else {
                return rejectWithValue(data.message || 'Profile update failed');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 1.3 Send Login OTP
export const sendLoginOtp = createAsyncThunk(
  'auth/sendLoginOtp',
  async (identifier: string, { rejectWithValue }) => {
    try {
      const response = await apiService.post(
        ENDPOINTS.AUTH.SEND_LOGIN_OTP,
        {
          email: identifier   // ✅ map here
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        return data;
      } else {
        return rejectWithValue(data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// 1.4 Verify Login OTP
export const verifyLoginOtp = createAsyncThunk(
  'auth/verifyLoginOtp',
  async (
    { identifier, otp }: { identifier: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post(
        ENDPOINTS.AUTH.VERIFY_LOGIN_OTP,
        {
          email: identifier,   // ✅ change here
          otp
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        const user = {
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          company: data.data.company,
          designation: data.data.designation,
          phone_number: data.data.phone_number,
        };

        // ✅ same as login
        localStorage.setItem('token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(user));

        return data;
      } else {
        return rejectWithValue(data.message || 'OTP verification failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);


// 2. Signup
// ... (omitted actionSignup logic for brevity if possible, but I should keep it working)
export const signupUser = createAsyncThunk(
    'auth/signupUser',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await apiService.post(`${ENDPOINTS.AUTH.LOGIN.replace('/login', '/signup')}`, userData);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data;
            } else {
                // Extract detailed error message if available
                let errorMessage = data.message || 'Signup failed';
                if (data.errors && typeof data.errors === 'object') {
                    const firstKey = Object.keys(data.errors)[0];
                    if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length > 0) {
                        errorMessage = data.errors[firstKey][0];

                        // Customize "already taken" message for email
                        if (firstKey === 'email' && errorMessage.toLowerCase().includes('already been taken')) {
                            errorMessage = 'This email address is already registered. Please login.';
                        }
                    }
                }
                return rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 2.1 Verify Email
export const verifyEmail = createAsyncThunk(
    'auth/verifyEmail',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await apiService.get(`${ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data;
            } else {
                return rejectWithValue(data.message || 'Verification failed');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 3. Logout
export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { getState, rejectWithValue }) => {
        try {
            // Get token before clearing
            const state: any = getState();
            const token = state.auth.token || localStorage.getItem('token');

            // Clear immediately to prevent other requests from triggering "expired" redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Call API with the token we saved
            const response = await apiService.post(ENDPOINTS.AUTH.LOGOUT, {}, { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                skipAuthRedirect: true 
            } as any);
            
            const data = await response.json();
            return data;
        } catch (error: any) {
            // Ensure cleared even on network error
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 4. Request Password Reset (Forgot Password)
export const requestPasswordReset = createAsyncThunk(
    'auth/requestPasswordReset',
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data;
            } else {
                return rejectWithValue(data.message || 'Failed to send reset link');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 5. Reset Password
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async (payload: { token: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data;
            } else {
                return rejectWithValue(data.message || 'Password reset failed');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// 6. Change Password
export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await apiService.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
            const data = await response.json();

            if (data.status === 'success' || data.status === true) {
                return data;
            } else {
                return rejectWithValue(data.message || 'Password update failed');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error occurred');
        }
    }
);

// --- Slice Definition ---
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Synchronous logout fallback or token clear
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // REQUEST PASSWORD RESET
        builder.addCase(requestPasswordReset.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(requestPasswordReset.fulfilled, (state) => {
            state.isLoading = false;
        });
        builder.addCase(requestPasswordReset.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // RESET PASSWORD
        builder.addCase(resetPassword.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(resetPassword.fulfilled, (state) => {
            state.isLoading = false;
        });
        builder.addCase(resetPassword.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // LOGIN
        builder.addCase(loginUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(loginUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.token = action.payload.data.access_token;
            state.user = {
                id: action.payload.data.id,
                name: action.payload.data.name,
                email: action.payload.data.email,
                company: action.payload.data.company,
                designation: action.payload.data.designation,
                phone_number: action.payload.data.phone_number
            };
        });
        builder.addCase(loginUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // FETCH ME
        builder.addCase(fetchMe.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchMe.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
        });
        builder.addCase(fetchMe.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // UPDATE PROFILE
        builder.addCase(updateProfile.pending, (state) => {
            state.isUpdatingProfile = true;
            state.error = null;
        });
        builder.addCase(updateProfile.fulfilled, (state, action) => {
            state.isUpdatingProfile = false;
            state.user = action.payload;
        });
        builder.addCase(updateProfile.rejected, (state, action) => {
            state.isUpdatingProfile = false;
            state.error = action.payload as string;
        });

        // SIGNUP
        builder.addCase(signupUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(signupUser.fulfilled, (state) => {
            state.isLoading = false;
            // Depending on requirements, we might automatically log them in or redirect them.
            // Usually, user must log in after signup.
        });

        // VERIFY EMAIL
        builder.addCase(verifyEmail.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(verifyEmail.fulfilled, (state) => {
            state.isLoading = false;
        });
        builder.addCase(verifyEmail.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // LOGOUT
        builder.addCase(logoutUser.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(logoutUser.fulfilled, (state) => {
            state.isLoading = false;
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        });
        builder.addCase(logoutUser.rejected, (state, action) => {
            state.isLoading = false;
            state.user = null; // Force clear anyway
            state.token = null;
            state.isAuthenticated = false;
            state.error = action.payload as string;
        });

        // SEND LOGIN OTP
        builder.addCase(sendLoginOtp.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(sendLoginOtp.fulfilled, (state) => {
            state.isLoading = false;
        });
        builder.addCase(sendLoginOtp.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // VERIFY LOGIN OTP
        builder.addCase(verifyLoginOtp.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(verifyLoginOtp.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.token = action.payload.data.access_token;
            state.user = {
                id: action.payload.data.id,
                name: action.payload.data.name,
                email: action.payload.data.email,
                company: action.payload.data.company,
                designation: action.payload.data.designation,
                phone_number: action.payload.data.phone_number
            };
        });
        builder.addCase(verifyLoginOtp.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });
    },
});

export const { clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
