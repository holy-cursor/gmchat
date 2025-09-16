// EVM Service for handling Ethereum-compatible blockchain transactions
// This service will work with ethers.js when it's installed

import { SUPPORTED_EVM_CHAINS, EVMChain, EVMTransaction, EVMMessage } from '../types/evm';

export interface EVMProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback: (data: any) => void) => void;
}

export interface EVMSigner {
  getAddress: () => Promise<string>;
  getChainId: () => Promise<number>;
  signTransaction: (transaction: any) => Promise<string>;
  sendTransaction: (transaction: any) => Promise<any>;
}

export class EVMService {
  private provider: EVMProvider | null = null;
  private signer: EVMSigner | null = null;
  private currentChainId: number | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    // Check if MetaMask or other EVM wallet is available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum;
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: string[]) => {
      console.log('EVM accounts changed:', accounts);
      // Handle account change
    });

    this.provider.on('chainChanged', (chainId: string) => {
      console.log('EVM chain changed:', chainId);
      this.currentChainId = parseInt(chainId, 16);
      // Handle chain change
    });
  }

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    if (!this.provider) {
      throw new Error('No EVM wallet found. Please install MetaMask or another EVM wallet.');
    }

    try {
      // Request account access
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // Get current chain ID
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      this.currentChainId = parseInt(chainId, 16);

      // Create signer (this would use ethers.js in the full implementation)
      this.signer = {
        getAddress: () => Promise.resolve(address),
        getChainId: () => Promise.resolve(this.currentChainId!),
        signTransaction: async (tx) => {
          // This would be implemented with ethers.js
          throw new Error('Ethers.js not installed - this is a placeholder implementation');
        },
        sendTransaction: async (tx) => {
          // This would be implemented with ethers.js
          throw new Error('Ethers.js not installed - this is a placeholder implementation');
        }
      };

      return { address, chainId: this.currentChainId };
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error);
      throw new Error('Failed to connect wallet. Please try again.');
    }
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    const chain = SUPPORTED_EVM_CHAINS.find(c => c.id === chainId);
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      this.currentChainId = chainId;
    } catch (error: any) {
      // If the chain is not added to the wallet, add it
      if (error.code === 4902) {
        await this.addChain(chain);
      } else {
        throw error;
      }
    }
  }

  private async addChain(chain: EVMChain): Promise<void> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    await this.provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chain.id.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: [chain.rpcUrl],
        blockExplorerUrls: [chain.blockExplorerUrl],
      }],
    });
  }

  async getBalance(address: string, chainId?: number): Promise<string> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    const targetChainId = chainId || this.currentChainId;
    if (!targetChainId) {
      throw new Error('No chain selected');
    }

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  async estimateGas(transaction: {
    from: string;
    to: string;
    value: string;
    data?: string;
  }): Promise<string> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    try {
      const gasEstimate = await this.provider.request({
        method: 'eth_estimateGas',
        params: [transaction],
      });
      return gasEstimate;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    try {
      const gasPrice = await this.provider.request({
        method: 'eth_gasPrice',
        params: [],
      });
      return gasPrice;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw new Error('Failed to get gas price');
    }
  }

  async sendMessage(
    recipient: string,
    content: string,
    value: string = '1000000000000000' // 0.001 ETH in wei
  ): Promise<{ hash: string; transaction: EVMTransaction }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const from = await this.signer.getAddress();
    const chainId = await this.signer.getChainId();

    // Estimate gas for the transaction
    const gasEstimate = await this.estimateGas({
      from,
      to: recipient,
      value,
    });

    // Get current gas price
    const gasPrice = await this.getGasPrice();

    // Create transaction object
    const transaction = {
      from,
      to: recipient,
      value,
      gas: gasEstimate,
      gasPrice,
      chainId,
    };

    try {
      // This would use ethers.js in the full implementation
      // For now, we'll simulate the transaction
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      const evmTransaction: EVMTransaction = {
        hash: mockHash,
        from,
        to: recipient,
        value,
        gasUsed: gasEstimate,
        gasPrice,
        timestamp: Date.now(),
        blockNumber: 0, // Would be filled by actual transaction
        status: 'pending',
      };

      return {
        hash: mockHash,
        transaction: evmTransaction,
      };
    } catch (error) {
      console.error('Failed to send EVM message:', error);
      throw new Error('Failed to send message');
    }
  }

  async getTransactionReceipt(hash: string): Promise<EVMTransaction | null> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    try {
      const receipt = await this.provider.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      });

      if (!receipt) return null;

      return {
        hash: receipt.transactionHash,
        from: receipt.from,
        to: receipt.to,
        value: receipt.value,
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.gasPrice,
        timestamp: Date.now(), // Would be calculated from block timestamp
        blockNumber: parseInt(receipt.blockNumber, 16),
        status: receipt.status === '0x1' ? 'confirmed' : 'failed',
      };
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      return null;
    }
  }

  formatBalance(balance: string, decimals: number = 18): string {
    const value = parseInt(balance, 16);
    const formatted = value / Math.pow(10, decimals);
    return formatted.toFixed(6);
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getChainById(chainId: number): EVMChain | undefined {
    return SUPPORTED_EVM_CHAINS.find(chain => chain.id === chainId);
  }

  isConnected(): boolean {
    return this.signer !== null;
  }

  getCurrentChainId(): number | null {
    return this.currentChainId;
  }

  disconnect(): void {
    this.signer = null;
    this.currentChainId = null;
  }
}

// Export singleton instance
export const evmService = new EVMService();
