/**
 * API Configuration and Client Setup
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface ApiError {
  detail: string;
  status_code: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log('🔐 [ApiClient] Token found, adding Authorization header');
    } else {
      console.log('⚠️ [ApiClient] No token available');
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`🌐 [ApiClient] ${method} ${url}`, { token: this.token ? 'present' : 'missing' });
      
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      console.log(`📥 [ApiClient] Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 [ApiClient] 401 Unauthorized, clearing token');
          this.clearToken();
          window.location.href = '/login';
        }
        let error_msg = 'Unknown error';
        try {
          const error: ApiError = await response.json();
          error_msg = error.detail || `Error: ${response.status}`;
        } catch {
          error_msg = `Error: ${response.status}`;
        }
        console.error(`❌ [ApiClient] Request failed: ${error_msg}`);
        return {
          error: error_msg,
          status: response.status,
        };
      }

      const data = await response.json();
      console.log(`✅ [ApiClient] Response data received, ${typeof data === 'object' ? Object.keys(data as any).length : 1} fields`);
      return { data, status: response.status };
    } catch (error) {
      console.error('💥 [ApiClient] Request exception:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET');
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', body);
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse, ApiError };
