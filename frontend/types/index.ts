// ============================================================================
// SybilShield Frontend - Type Definitions
// ============================================================================

// ============================================================================
// Badge Types
// ============================================================================

export type BadgeStatus = 'none' | 'active' | 'expired' | 'revoked';

export interface SybilBadge {
  id: string;
  owner: string;
  issuer: string;
  createdAt: number;
  expiresAt: number;
  proofHash: string;
  nonce: string;
  status: BadgeStatus;
}

export interface BadgeStatusResponse {
  has_badge: boolean;
  badge_status: BadgeStatus;
  expires_at?: number;
  issuer?: string;
  created_at?: number;
  badge_id?: string;
  proof_hash?: string;
  nonce?: string;
  message: string;
}

// ============================================================================
// Verification Types
// ============================================================================

export type VerificationProvider = 'proof_of_humanity' | 'worldcoin' | 'brightid' | 'liveness';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface VerificationResponse {
  verification_id: string;
  status: VerificationStatus;
  proof_hash: string;
  expires_at: number;
  provider: VerificationProvider;
  message: string;
}

export interface VerificationRequest {
  provider: VerificationProvider;
  profileUrl?: string;
  token?: string;
  brightIdContext?: string;
  livenessProof?: string;
  address: string;
}

// ============================================================================
// Proposal Types
// ============================================================================

export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

export interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  endsAt: number;
  votesYes: number;
  votesNo: number;
  status: ProposalStatus;
  hasVoted?: boolean;
  userVote?: boolean;
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  durationBlocks: number;
}

export interface VoteRequest {
  proposalId: number;
  voteChoice: boolean;
  badgeNonce: string;
}

export interface VoteResponse {
  success: boolean;
  voteRecorded: boolean;
  message: string;
  transactionId?: string;
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
  publicKey: string | null;
}

export interface Transaction {
  id: string;
  type: 'badge_issue' | 'vote' | 'proposal_create';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: number;
  version: string;
  services: {
    aleo: 'connected' | 'disconnected';
    poh: 'connected' | 'disconnected' | 'not_configured';
    worldcoin: 'connected' | 'disconnected' | 'not_configured';
  };
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface BadgeCardProps {
  badge: SybilBadge | null;
  loading?: boolean;
  onRenew?: () => void;
}

export interface ProposalCardProps {
  proposal: Proposal;
  onVote?: (proposalId: number, vote: boolean) => void;
  onViewDetails?: (proposalId: number) => void;
}

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export interface VerificationFormProps {
  onComplete: (verificationId: string) => void;
  onError: (error: string) => void;
}

// ============================================================================
// Form Types
// ============================================================================

export interface VerificationFormData {
  provider: VerificationProvider;
  pohProfileUrl?: string;
  worldcoinToken?: string;
  brightIdContext?: string;
}

export interface ProposalFormData {
  title: string;
  description: string;
  duration: number;
}

// ============================================================================
// Store Types
// ============================================================================

export interface AppState {
  // Wallet
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;
  
  // Badge
  badge: SybilBadge | null;
  setBadge: (badge: SybilBadge | null) => void;
  
  // Proposals
  proposals: Proposal[];
  setProposals: (proposals: Proposal[]) => void;
  addProposal: (proposal: Proposal) => void;
  
  // Verification
  verificationId: string | null;
  setVerificationId: (id: string | null) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}
