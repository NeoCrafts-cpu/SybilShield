// ============================================================================
// SybilShield Frontend - API Service
// ============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  VerificationResponse, 
  BadgeStatusResponse,
  HealthResponse,
  ApiResponse,
} from '@/types';

// ============================================================================
// Configuration
// ============================================================================

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:5000';

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private walletAddress: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: RELAYER_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add wallet address header
    this.client.interceptors.request.use((config) => {
      if (this.walletAddress) {
        config.headers['X-Wallet-Address'] = this.walletAddress;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = this.getErrorMessage(error);
        console.error('API Error:', message);
        return Promise.reject(new Error(message));
      }
    );
  }

  // Set the wallet address for authenticated requests
  setWalletAddress(address: string | null) {
    this.walletAddress = address;
    console.log('[API] Wallet address set:', address ? `${address.slice(0, 10)}...` : 'null');
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as { message?: string; error?: string };
      return data.message || data.error || 'An error occurred';
    }
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred';
  }

  // ===========================================================================
  // Health Check
  // ===========================================================================

  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get('/health');
      return response.data.data || response.data;
    } catch {
      return {
        status: 'error',
        timestamp: Date.now(),
        version: '1.0.0',
        services: {
          aleo: 'disconnected',
          poh: 'disconnected',
          worldcoin: 'disconnected',
        },
      };
    }
  }

  // ===========================================================================
  // Verification Endpoints
  // ===========================================================================

  async verifyPoH(profileUrl: string, address: string): Promise<VerificationResponse> {
    const response = await this.client.post('/verify/proof-of-humanity', {
      poh_profile_url: profileUrl,
      address,
    });
    // Handle nested response structure from relayer
    return response.data.data || response.data;
  }

  async verifyWorldcoin(token: string, address: string): Promise<VerificationResponse> {
    const response = await this.client.post('/verify/worldcoin', {
      worldcoin_token: token,
      address,
    });
    return response.data.data || response.data;
  }

  async verifyBrightID(contextId: string, address: string): Promise<VerificationResponse> {
    const response = await this.client.post('/verify/brightid', {
      context_id: contextId,
      address,
    });
    return response.data.data || response.data;
  }

  async verifyLiveness(proofHash: string, address: string): Promise<VerificationResponse> {
    const response = await this.client.post('/verify/liveness', {
      proof_hash: proofHash,
      address,
    });
    // Handle nested response structure from relayer
    return response.data.data || response.data;
  }

  async getVerificationStatus(verificationId: string): Promise<VerificationResponse> {
    const response = await this.client.get(`/verify/status/${verificationId}`);
    return response.data.data || response.data;
  }

  // ===========================================================================
  // Badge Endpoints
  // ===========================================================================

  async getBadgeStatus(address: string): Promise<BadgeStatusResponse> {
    try {
      const response = await this.client.get(`/badge/status/${address}`);
      // Handle nested response structure from relayer
      return response.data.data || response.data;
    } catch (error) {
      console.error('getBadgeStatus error:', error);
      // Return no-badge status if relayer is unavailable
      return {
        has_badge: false,
        badge_status: 'none',
        message: 'Could not check badge status - relayer unavailable',
      };
    }
  }

  async requestBadgeIssuance(
    address: string, 
    verificationId: string
  ): Promise<ApiResponse<{ transaction_id: string }>> {
    try {
      console.log('Requesting badge issuance:', { address, verificationId });
      const response = await this.client.post('/badge/request-issuance', {
        address,
        verification_id: verificationId,
      });
      console.log('Badge issuance response:', response.data);
      // Handle nested response structure
      return response.data.data ? response.data : { success: true, data: response.data };
    } catch (error) {
      console.error('Badge issuance error:', error);
      throw error; // Don't swallow the error - let it propagate
    }
  }

  async renewBadge(address: string): Promise<ApiResponse<{ transaction_id: string }>> {
    const response = await this.client.post('/badge/renew', { address });
    return response.data;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const api = new ApiClient();
export default api;
