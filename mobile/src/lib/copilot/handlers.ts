import { z } from 'zod';
import { 
  bsTraceServer, 
  bsAddressServer, 
  bsContractServer,
  calculateRiskScore,
  isRecentContract,
  type BlockscoutTrace,
  type BlockscoutAddressInfo,
  type BlockscoutContractInfo
} from '../partners/blockscout';

// Zod schemas for validation
const CopilotActionSchema = z.object({
  type: z.enum(['REVOKE', 'LIMIT', 'PAY_PYUSD', 'VIEW', 'APPROVE']),
  title: z.string(),
  description: z.string(),
  params: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
});

const CopilotResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  riskScore: z.number().min(0).max(10).optional(),
  actions: z.array(CopilotActionSchema),
  source: z.enum(['blockscout', 'mock']).optional(),
});

export type CopilotAction = z.infer<typeof CopilotActionSchema>;
export type CopilotResponse = z.infer<typeof CopilotResponseSchema>;

class BlockscoutCopilotHandler {
  
  // Explain transaction using Blockscout trace data
  async explainTransaction(txHash: `0x${string}`): Promise<CopilotResponse> {
    try {
      const trace = await bsTraceServer(txHash);
      
      if (!trace) {
        throw new Error('No trace data available');
      }

      return this.analyzeTransactionTrace(trace);
    } catch (error) {
      console.warn('Error explaining transaction:', error);
      return this.getFallbackTransactionExplanation(txHash);
    }
  }

  // Analyze spender risk using address and contract data
  async analyzeSpenderRisk(spenderAddr: `0x${string}`, userAddr: `0x${string}`): Promise<CopilotResponse> {
    try {
      const [addressInfo, contractInfo] = await Promise.all([
        bsAddressServer(spenderAddr),
        bsContractServer(spenderAddr),
      ]);

      return this.assessSpenderRisk(spenderAddr, addressInfo, contractInfo, userAddr);
    } catch (error) {
      console.warn('Error analyzing spender risk:', error);
      return this.getFallbackSpenderAnalysis(spenderAddr);
    }
  }

  // Generate settlement plan (using existing logic + Blockscout data)
  async generateSettlementPlan(userAddr: `0x${string}`, groupMembers: string[]): Promise<CopilotResponse> {
    try {
      // Get address info for all group members
      const memberInfos = await Promise.all(
        groupMembers.map(addr => bsAddressServer(addr as `0x${string}`))
      );

      return this.createSettlementPlan(userAddr, groupMembers, memberInfos);
    } catch (error) {
      console.warn('Error generating settlement plan:', error);
      return this.getFallbackSettlementPlan(userAddr, groupMembers);
    }
  }

  // Private methods for analysis

  private analyzeTransactionTrace(trace: BlockscoutTrace): CopilotResponse {
    const actions: CopilotAction[] = [];
    let riskScore = 0;
    let summary = '';

    // Analyze decoded calls
    for (const call of trace.decoded) {
      switch (call.method.toLowerCase()) {
        case 'approve':
          const amount = call.params.amount || call.params.value;
          const isInfinite = amount === '115792089237316195423570985008687907853269984665640564039457584007913129639935' || 
                           amount === 'unlimited';
          
          if (isInfinite) {
            riskScore += 3;
            summary += `Infinite approval granted to ${this.formatAddress(call.to)}. `;
            actions.push({
              type: 'REVOKE',
              title: 'Revoke Infinite Approval',
              description: 'Remove unlimited spending permission',
              data: { spenderAddress: call.to, token: call.params.token }
            });
          } else {
            actions.push({
              type: 'LIMIT',
              title: 'Set Spending Limit',
              description: `Limit approval to ${amount} tokens`,
              data: { spenderAddress: call.to, amount, token: call.params.token }
            });
          }
          break;

        case 'transfer':
        case 'transferfrom':
          const transferAmount = call.params.amount || call.params.value;
          summary += `Transferred ${transferAmount} tokens to ${this.formatAddress(call.params.recipient || call.params.to)}. `;
          actions.push({
            type: 'VIEW',
            title: 'View Transfer Details',
            description: 'See full transfer information',
            data: { txHash: trace.hash, method: call.method }
          });
          break;

        case 'swap':
        case 'swapexacttokensfortokens':
          summary += `Token swap executed. `;
          actions.push({
            type: 'VIEW',
            title: 'View Swap Details',
            description: 'See swap parameters and rates',
            data: { txHash: trace.hash, method: call.method }
          });
          break;

        default:
          summary += `Called ${call.method} on ${this.formatAddress(call.to)}. `;
      }
    }

    // Check contract verification and age
    if (!trace.verified) {
      riskScore += 3;
      summary += 'Interacted with unverified contract. ';
    }

    if (isRecentContract(trace.ageSec)) {
      riskScore += 2;
      summary += 'Contract is less than 7 days old. ';
    }

    // Add labels context
    const labelEntries = Object.entries(trace.labels);
    if (labelEntries.length > 0) {
      const labelText = labelEntries.map(([addr, label]) => label).join(', ');
      summary += `Involves: ${labelText}. `;
    }

    // Always add view action
    actions.push({
      type: 'VIEW',
      title: 'View on Blockscout',
      description: 'Open transaction in blockchain explorer',
      data: { txHash: trace.hash }
    });

    const response: CopilotResponse = {
      title: trace.status === 'ok' ? 'Transaction Successful' : 'Transaction Failed',
      summary: summary.trim() || 'Transaction processed successfully.',
      riskScore: Math.min(10, riskScore),
      actions,
      source: trace.source === 'mock' ? 'mock' : 'blockscout',
    };

    // Validate response
    return this.validateResponse(response);
  }

  private assessSpenderRisk(
    spenderAddr: string, 
    addressInfo: BlockscoutAddressInfo, 
    contractInfo: BlockscoutContractInfo,
    userAddr: string
  ): CopilotResponse {
    const riskScore = calculateRiskScore(contractInfo, addressInfo);
    const actions: CopilotAction[] = [];
    const riskFactors: string[] = [];

    // Build risk assessment
    if (!contractInfo.verified) {
      riskFactors.push('Unverified contract');
    }
    
    if (isRecentContract(contractInfo.ageSec)) {
      riskFactors.push('New contract (less than 7 days old)');
    }
    
    if (addressInfo.txCount < 10) {
      riskFactors.push('Very low transaction count');
    }

    // Generate actions based on risk level
    if (riskScore >= 7) {
      actions.push({
        type: 'REVOKE',
        title: 'Revoke All Approvals',
        description: 'Remove all spending permissions for this address',
        data: { spenderAddress: spenderAddr }
      });
    } else if (riskScore >= 4) {
      actions.push({
        type: 'LIMIT',
        title: 'Set Spending Limits',
        description: 'Limit the amount this address can spend',
        data: { spenderAddress: spenderAddr }
      });
    }

    actions.push({
      type: 'VIEW',
      title: 'View Address Details',
      description: 'See full address information on Blockscout',
      data: { address: spenderAddr }
    });

    const riskLevel = riskScore >= 7 ? 'HIGH' : riskScore >= 4 ? 'MEDIUM' : 'LOW';
    const summary = riskFactors.length > 0 
      ? `${riskLevel} risk spender. Issues: ${riskFactors.join(', ')}.`
      : `${riskLevel} risk spender. Address appears safe to interact with.`;

    const response: CopilotResponse = {
      title: `Spender Risk Assessment: ${riskLevel}`,
      summary,
      riskScore,
      actions,
      source: addressInfo.source === 'mock' ? 'mock' : 'blockscout',
    };

    return this.validateResponse(response);
  }

  private createSettlementPlan(
    userAddr: string, 
    groupMembers: string[], 
    memberInfos: BlockscoutAddressInfo[]
  ): CopilotResponse {
    const actions: CopilotAction[] = [];
    
    // Mock settlement logic (in real app, this would use actual balances)
    const mockDebts = [
      { member: groupMembers[1], amount: 25.50, verified: memberInfos[1]?.verified },
      { member: groupMembers[2], amount: 12.75, verified: memberInfos[2]?.verified },
    ];

    let summary = `You have ${mockDebts.length} pending settlements. `;
    
    mockDebts.forEach(debt => {
      const verifiedText = debt.verified ? '(verified)' : '(unverified)';
      summary += `${this.formatAddress(debt.member)} ${verifiedText} owes $${debt.amount}. `;
      
      actions.push({
        type: 'PAY_PYUSD',
        title: `Request $${debt.amount} from ${this.formatAddress(debt.member)}`,
        description: `Send payment request for outstanding balance`,
        data: { 
          recipient: debt.member, 
          amount: debt.amount,
          token: 'PYUSD',
          verified: debt.verified
        }
      });
    });

    const totalOwed = mockDebts.reduce((sum, debt) => sum + debt.amount, 0);
    
    if (mockDebts.length > 1) {
      actions.push({
        type: 'PAY_PYUSD',
        title: `Batch Request $${totalOwed.toFixed(2)}`,
        description: 'Send payment requests to all debtors at once',
        data: { 
          recipients: mockDebts.map(d => d.member),
          amounts: mockDebts.map(d => d.amount),
          token: 'PYUSD'
        }
      });
    }

    const response: CopilotResponse = {
      title: 'Settlement Plan Generated',
      summary: summary.trim(),
      actions,
      source: memberInfos.some(info => info?.source === 'mock') ? 'mock' : 'blockscout',
    };

    return this.validateResponse(response);
  }

  // Fallback methods for when Blockscout is unavailable

  private getFallbackTransactionExplanation(txHash: string): CopilotResponse {
    return {
      title: 'Transaction Analysis (Mock Mode)',
      summary: 'Unable to fetch real transaction data. This is a mock explanation for demo purposes.',
      riskScore: 3,
      actions: [
        {
          type: 'VIEW',
          title: 'View on Blockscout',
          description: 'Open transaction in blockchain explorer',
          data: { txHash }
        }
      ],
      source: 'mock',
    };
  }

  private getFallbackSpenderAnalysis(spenderAddr: string): CopilotResponse {
    return {
      title: 'Spender Risk Assessment (Mock Mode)',
      summary: 'Unable to fetch real address data. This is a mock risk assessment for demo purposes.',
      riskScore: 5,
      actions: [
        {
          type: 'LIMIT',
          title: 'Set Spending Limits',
          description: 'Limit the amount this address can spend',
          data: { spenderAddress: spenderAddr }
        },
        {
          type: 'VIEW',
          title: 'View Address Details',
          description: 'See address information on Blockscout',
          data: { address: spenderAddr }
        }
      ],
      source: 'mock',
    };
  }

  private getFallbackSettlementPlan(userAddr: string, groupMembers: string[]): CopilotResponse {
    return {
      title: 'Settlement Plan (Mock Mode)',
      summary: 'Unable to fetch real member data. This is a mock settlement plan for demo purposes.',
      actions: [
        {
          type: 'PAY_PYUSD',
          title: 'Request Payment',
          description: 'Send payment request to group members',
          data: { recipients: groupMembers, token: 'PYUSD' }
        }
      ],
      source: 'mock',
    };
  }

  // Utility methods

  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private validateResponse(response: CopilotResponse): CopilotResponse {
    try {
      return CopilotResponseSchema.parse(response);
    } catch (error) {
      console.warn('Invalid copilot response, using fallback:', error);
      
      // Return safe fallback
      return {
        title: 'Analysis Complete (Plan Only)',
        summary: 'Analysis completed but response format was invalid. Please try again.',
        actions: [],
        source: 'mock',
      };
    }
  }
}

// Create singleton instance
export const blockscoutCopilot = new BlockscoutCopilotHandler();

export default blockscoutCopilot;
