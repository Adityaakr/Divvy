import Constants from 'expo-constants';

// Get configuration from environment
const config = {
  clearNodeUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLEARNODE_URL || 'wss://clearnet.yellow.com/ws',
  privateKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_PRIVATE_KEY || '',
  network: Constants.expoConfig?.extra?.EXPO_PUBLIC_NETWORK || 'polygon',
  rpcUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_RPC_URL || 'https://polygon-rpc.com',
  appName: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_NAME || 'SplitSafe',
  scope: Constants.expoConfig?.extra?.EXPO_PUBLIC_SCOPE || 'app.splitsafe.mobile',
  accountAddress: Constants.expoConfig?.extra?.EXPO_PUBLIC_ACCOUNT_ADDRESS || '',
  enabled: Constants.expoConfig?.extra?.EXPO_PUBLIC_YELLOW_ENABLED === 'true',
};

export interface StateChannelEscrow {
  id: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  memo?: string;
  status: 'QUEUED' | 'SETTLING' | 'SETTLED' | 'FAILED';
  createdAt: number;
  settledAt?: number;
  txHash?: string;
}

export interface SessionState {
  id: string;
  escrows: StateChannelEscrow[];
  totalAmount: number;
  status: 'ACTIVE' | 'SETTLING' | 'SETTLED' | 'FAILED';
  createdAt: number;
  settledAt?: number;
  batchTxHash?: string;
}

class ClearNodeClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private currentSession: SessionState | null = null;

  constructor() {
    if (config.enabled) {
      this.connect();
    }
  }

  // Connection management
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(config.clearNodeUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to ClearNode');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.authenticate();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          console.log('Disconnected from ClearNode');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('ClearNode WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting to ClearNode (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private authenticate(): void {
    if (!this.isConnected || !this.ws) return;

    const authMessage = {
      type: 'auth',
      data: {
        privateKey: config.privateKey,
        network: config.network,
        appName: config.appName,
        scope: config.scope,
        accountAddress: config.accountAddress,
      },
    };

    this.ws.send(JSON.stringify(authMessage));
  }

  private handleMessage(message: any): void {
    const { type, data } = message;
    
    switch (type) {
      case 'auth_success':
        console.log('ClearNode authentication successful');
        break;
      case 'auth_error':
        console.error('ClearNode authentication failed:', data);
        break;
      case 'session_update':
        this.handleSessionUpdate(data);
        break;
      case 'escrow_update':
        this.handleEscrowUpdate(data);
        break;
      case 'settlement_complete':
        this.handleSettlementComplete(data);
        break;
      default:
        // Handle custom message types
        const handler = this.messageHandlers.get(type);
        if (handler) {
          handler(data);
        }
    }
  }

  private handleSessionUpdate(data: any): void {
    if (this.currentSession && this.currentSession.id === data.sessionId) {
      this.currentSession = { ...this.currentSession, ...data };
    }
  }

  private handleEscrowUpdate(data: any): void {
    if (this.currentSession) {
      const escrowIndex = this.currentSession.escrows.findIndex(e => e.id === data.escrowId);
      if (escrowIndex !== -1) {
        this.currentSession.escrows[escrowIndex] = { ...this.currentSession.escrows[escrowIndex], ...data };
      }
    }
  }

  private handleSettlementComplete(data: any): void {
    if (this.currentSession && this.currentSession.id === data.sessionId) {
      this.currentSession.status = 'SETTLED';
      this.currentSession.settledAt = Date.now();
      this.currentSession.batchTxHash = data.txHash;
    }
  }

  // Public API methods
  public isEnabled(): boolean {
    return config.enabled;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async createSession(): Promise<SessionState> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      escrows: [],
      totalAmount: 0,
      status: 'ACTIVE',
      createdAt: Date.now(),
    };

    if (this.isConnected && this.ws) {
      const message = {
        type: 'create_session',
        data: {
          sessionId,
          network: config.network,
        },
      };
      this.ws.send(JSON.stringify(message));
    }

    return this.currentSession;
  }

  public async addEscrowToSession(escrow: Omit<StateChannelEscrow, 'id' | 'status' | 'createdAt'>): Promise<StateChannelEscrow> {
    if (!this.currentSession) {
      throw new Error('No active session. Create a session first.');
    }

    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newEscrow: StateChannelEscrow = {
      ...escrow,
      id: escrowId,
      status: 'QUEUED',
      createdAt: Date.now(),
    };

    this.currentSession.escrows.push(newEscrow);
    this.currentSession.totalAmount += escrow.amount;

    if (this.isConnected && this.ws) {
      const message = {
        type: 'add_escrow',
        data: {
          sessionId: this.currentSession.id,
          escrow: newEscrow,
        },
      };
      this.ws.send(JSON.stringify(message));
    }

    return newEscrow;
  }

  public async settleSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to settle.');
    }

    this.currentSession.status = 'SETTLING';

    if (this.isConnected && this.ws) {
      const message = {
        type: 'settle_session',
        data: {
          sessionId: this.currentSession.id,
          escrows: this.currentSession.escrows,
        },
      };
      this.ws.send(JSON.stringify(message));
    } else {
      // Simulate settlement for offline mode
      setTimeout(() => {
        if (this.currentSession) {
          this.currentSession.status = 'SETTLED';
          this.currentSession.settledAt = Date.now();
          this.currentSession.batchTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
          
          // Update all escrows to settled
          this.currentSession.escrows.forEach(escrow => {
            escrow.status = 'SETTLED';
            escrow.settledAt = Date.now();
            escrow.txHash = this.currentSession!.batchTxHash;
          });
        }
      }, 2000);
    }
  }

  public getCurrentSession(): SessionState | null {
    return this.currentSession;
  }

  public clearSession(): void {
    this.currentSession = null;
  }

  public onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

// Create singleton instance
export const clearNodeClient = new ClearNodeClient();

// Export types and client
export default clearNodeClient;
