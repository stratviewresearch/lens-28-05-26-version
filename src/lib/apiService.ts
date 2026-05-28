/**
 * Centralized API Service for Stratview Dashboard
 * Handles token injection and global 401 Unauthorized errors.
 */

// Helper to handle 401 errors
const handle401 = (skipRedirect: boolean = false) => {
  const token = localStorage.getItem("token");
  
  // Clear local session
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // If we are explicitly skipping redirect OR if there was no token to begin with, return.
  // No token usually means a logout is already in progress or completed.
  if (skipRedirect || !token) return;

  // Force redirect to login page with an expired flag
  const baseUrl = import.meta.env.BASE_URL || "/";
  window.location.href = `${baseUrl}?expired=true`;
};

export const apiService = {
  /**
   * Base fetch wrapper
   */
  async request(endpoint: string, options: RequestInit & { skipAuthRedirect?: boolean } = {}) {
    // Get token directly from localStorage for consistency
    const token = localStorage.getItem("token");

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    };

    try {
      const response = await fetch(endpoint, config);

      // GLOBAL 401 HANDLER
      if (response.status === 401) {
        handle401(options.skipAuthRedirect);
        throw new Error("Unauthorized");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * GET Request
   */
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  },

  /**
   * POST Request
   */
  async post(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT Request
   */
  async put(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE Request
   */
  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  },
};
