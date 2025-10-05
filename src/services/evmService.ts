// EVM Service for handling Ethereum-compatible blockchain transactions
// This service uses ethers.js for real blockchain interactions

import { ethers } from 'ethers';
import { SUPPORTED_EVM_CHAINS, TESTNET_EVM_CHAINS, EVMChain, EVMTransaction } from '../types/evm';

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

export interface EVMWalletProviderInfo {
  name: string;
  id: string;
  icon: string;
  provider: any;
  isInstalled: boolean;
}

export class EVMService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private currentChainId: number | null = null;
  private currentWallet: string | null = null;

  constructor() {
    // Clear any existing connection state
    this.disconnect();
    this.initializeProvider();
  }

  // Get available EVM wallets
  getAvailableWallets(): EVMWalletProviderInfo[] {
    const wallets: EVMWalletProviderInfo[] = [];
    
    if (typeof window === 'undefined') return wallets;

    const ethereum = (window as any).ethereum;

    // MetaMask
    if (ethereum?.isMetaMask) {
      wallets.push({
        name: 'MetaMask',
        id: 'metamask',
        icon: '🦊',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Coinbase Wallet
    if (ethereum?.isCoinbaseWallet) {
      wallets.push({
        name: 'Coinbase Wallet',
        id: 'coinbase',
        icon: '🔵',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Phantom (EVM)
    if (ethereum?.isPhantom) {
      wallets.push({
        name: 'Phantom',
        id: 'phantom',
        icon: '👻',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Rabby Wallet
    if (ethereum?.isRabby) {
      wallets.push({
        name: 'Rabby Wallet',
        id: 'rabby',
        icon: '🐰',
        provider: ethereum,
        isInstalled: true
      });
    }

    // OKX Wallet
    if (ethereum?.isOkxWallet) {
      wallets.push({
        name: 'OKX Wallet',
        id: 'okx',
        icon: '⭕',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Zerion Wallet
    if (ethereum?.isZerion) {
      wallets.push({
        name: 'Zerion',
        id: 'zerion',
        icon: '🔮',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Trust Wallet
    if (ethereum?.isTrust) {
      wallets.push({
        name: 'Trust Wallet',
        id: 'trust',
        icon: '🛡️',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Rainbow Wallet
    if (ethereum?.isRainbow) {
      wallets.push({
        name: 'Rainbow',
        id: 'rainbow',
        icon: '🌈',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Brave Wallet
    if (ethereum?.isBraveWallet) {
      wallets.push({
        name: 'Brave Wallet',
        id: 'brave',
        icon: '🦁',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Frame Wallet
    if (ethereum?.isFrame) {
      wallets.push({
        name: 'Frame',
        id: 'frame',
        icon: '🖼️',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Generic ethereum provider (fallback for unknown wallets)
    if (ethereum && wallets.length === 0) {
      wallets.push({
        name: 'Ethereum Wallet',
        id: 'ethereum',
        icon: '⚡',
        provider: ethereum,
        isInstalled: true
      });
    }

    // Add uninstalled wallets for reference (remove duplicates)
    const installedIds = wallets.map(w => w.id);
    const allWallets = [
      { name: 'MetaMask', id: 'metamask', icon: '🦊' },
      { name: 'Coinbase Wallet', id: 'coinbase', icon: '🔵' },
      { name: 'Phantom', id: 'phantom', icon: '👻' },
      { name: 'Rabby Wallet', id: 'rabby', icon: '🐰' },
      { name: 'OKX Wallet', id: 'okx', icon: '⭕' },
      { name: 'Zerion', id: 'zerion', icon: '🔮' },
      { name: 'Trust Wallet', id: 'trust', icon: '🛡️' },
      { name: 'Rainbow', id: 'rainbow', icon: '🌈' },
      { name: 'Brave Wallet', id: 'brave', icon: '🦁' },
      { name: 'Frame', id: 'frame', icon: '🖼️' }
    ];

    allWallets.forEach(wallet => {
      if (!installedIds.includes(wallet.id)) {
        wallets.push({
          ...wallet,
          provider: null,
          isInstalled: false
        });
      }
    });

    return wallets;
  }

  private async initializeProvider() {
    // Check if MetaMask or other EVM wallet is available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Don't create provider immediately - only when explicitly connecting
      // this.provider = new ethers.BrowserProvider((window as any).ethereum);
      // this.setupEventListeners();
      console.log('EVM Service - Provider available but not initialized (no auto-connect)');
    } else {
      console.warn('EVM Service - No ethereum provider found');
    }
  }

  // Connect to a specific wallet
  async connectToWallet(walletId: string): Promise<{ address: string; chainId: number }> {
    console.log('EVM Service - connectToWallet called with walletId:', walletId);
    
    const wallets = this.getAvailableWallets();
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      console.error('EVM Service - Wallet not found:', walletId);
      throw new Error(`Wallet ${walletId} not found`);
    }
    
    console.log('EVM Service - Found wallet:', wallet.name, 'isInstalled:', wallet.isInstalled);
    
    // WalletConnect removed - only direct wallet connections supported
    
    if (!wallet.isInstalled) {
      console.error('EVM Service - Wallet not installed:', wallet.name);
      throw new Error(`${wallet.name} is not installed. Please install it first.`);
    }

    console.log('EVM Service - Connecting to installed wallet:', wallet.name);
    // Use the specific wallet provider
    this.provider = new ethers.BrowserProvider(wallet.provider);
    this.currentWallet = walletId;
    this.setupEventListeners();
    
    return this.connectWallet();
  }

  // Direct wallet connection fallback
  private async connectDirectWallet(): Promise<{ address: string; chainId: number }> {
    console.log('EVM Service - Attempting direct wallet connection...');
    
    // Try to use window.ethereum directly
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.currentWallet = 'ethereum';
      this.setupEventListeners();
      
      try {
        return await this.connectWallet();
      } catch (error) {
        console.error('EVM Service - Direct connection also failed:', error);
        throw new Error('Unable to connect to any wallet. Please make sure you have a compatible wallet installed and try again.');
      }
    }
    
    throw new Error('No wallet provider found. Please install MetaMask or another compatible wallet.');
  }

  // WalletConnect removed - only direct wallet connections supported

  // Create Alchemy provider for direct RPC calls
  private createAlchemyProvider(): ethers.JsonRpcProvider {
    const alchemyUrl = 'https://eth-sepolia.g.alchemy.com/v2/y5tMYX73TU3zfFeTr4YEi';
    return new ethers.JsonRpcProvider(alchemyUrl);
  }

  // Test RPC endpoint reliability
  private async testRPCConnection(): Promise<boolean> {
    if (!this.provider) return false;
    
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      console.warn('RPC connection test failed:', error);
      return false;
    }
  }

  // Switch MetaMask to use Alchemy RPC for better reliability
  private async switchToAlchemyRPC(): Promise<void> {
    if (!this.provider) return;

    try {
      console.log('EVM Service - Switching to Alchemy RPC for Sepolia...');
      
      // Try to switch to Alchemy RPC
      await this.provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]); // 11155111 in hex
      
      // If that fails, add the chain with Alchemy RPC
      try {
        await this.provider.send('wallet_addEthereumChain', [{
          chainId: '0xaa36a7', // 11155111 in hex
          chainName: 'Ethereum Sepolia',
          rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/y5tMYX73TU3zfFeTr4YEi'],
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }]);
        console.log('EVM Service - Successfully switched to Alchemy RPC');
      } catch (addError) {
        console.warn('EVM Service - Could not add Alchemy RPC, using default:', addError);
      }
    } catch (switchError) {
      console.warn('EVM Service - Could not switch to Alchemy RPC, using default:', switchError);
    }
  }

  // Try multiple RPC endpoints using the wallet's provider
  private async tryMultipleRPCs(): Promise<boolean> {
    if (!this.provider) return false;
    
    try {
      // Test the current provider (which uses the wallet's RPC)
      await this.provider.getBlockNumber();
      console.log('Wallet RPC endpoint working');
      return true;
    } catch (error) {
      console.warn('Wallet RPC endpoint failed:', error);
      return false;
    }
  }

  // Ensure provider is initialized before use
  private async ensureProvider() {
    if (!this.provider) {
      throw new Error('No EVM wallet connected. Please connect a wallet first.');
    }
  }

  // Ensure signer is initialized before use
  private async ensureSigner() {
    if (!this.signer) {
      if (!this.provider) {
        await this.ensureProvider();
      }
      this.signer = await this.provider!.getSigner();
    }
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
  }

  private setupEventListeners() {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;
    
    ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('EVM accounts changed:', accounts);
      // Handle account change
      if (accounts.length === 0) {
        this.disconnect();
      }
    });

    ethereum.on('chainChanged', (chainId: string) => {
      console.log('EVM chain changed:', chainId);
      this.currentChainId = parseInt(chainId, 16);
      // Handle chain change
    });
  }

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    try {
      // Ensure provider is initialized
      await this.ensureProvider();
      
      if (!this.provider) {
        throw new Error('No EVM wallet found. Please install MetaMask or another EVM wallet.');
      }

      // Request account access
      const accounts = await this.provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      if (!address) {
        throw new Error('No wallet address found');
      }

      // Get signer
      this.signer = await this.provider.getSigner();
      console.log('EVM Service - Signer obtained:', !!this.signer);

      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.currentChainId = Number(network.chainId);
      console.log('EVM Service - Network info:', { chainId: this.currentChainId, name: network.name });

      // Try to switch to Sepolia testnet if not already there
      if (this.currentChainId !== 11155111) {
        console.log('EVM Service - Switching to Sepolia testnet...');
        try {
          await this.provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]);
          this.currentChainId = 11155111;
          console.log('EVM Service - Successfully switched to Sepolia');
        } catch (switchError) {
          console.warn('EVM Service - Could not switch to Sepolia, user may need to add it manually:', switchError);
          // Don't throw error, just warn - user can manually switch
        }
      }

      // Switch to Alchemy RPC for Sepolia if needed
      if (this.currentChainId === 11155111) {
        await this.switchToAlchemyRPC();
      }

      return { address, chainId: this.currentChainId };
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error);
      
      // Safely extract error message
      let errorMessage = 'Failed to connect wallet';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else if ('reason' in error) {
          errorMessage = String(error.reason);
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      // Check if it's a user rejection/cancellation
      if (errorMessage.includes('User rejected') || 
          errorMessage.includes('User denied') || 
          errorMessage.includes('cancelled') ||
          errorMessage.includes('rejected') ||
          errorMessage.includes('User rejected the request') ||
          errorMessage.includes('User denied transaction') ||
          errorMessage.includes('User cancelled')) {
        throw new Error('Connection cancelled by user');
      } else {
        throw new Error(`Failed to connect wallet: ${errorMessage}`);
      }
    }
  }

  async switchChain(chainId: number): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No EVM wallet found');
    }

    // Check both mainnet and testnet chains
    const chain = [...SUPPORTED_EVM_CHAINS, ...TESTNET_EVM_CHAINS].find(c => c.id === chainId);
    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const ethereum = (window as any).ethereum;

    try {
      await ethereum.request({
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
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No EVM wallet found');
    }

    const ethereum = (window as any).ethereum;

    await ethereum.request({
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

    try {
      const balance = await this.provider.getBalance(address);
      return balance.toString();
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
      const gasEstimate = await this.provider.estimateGas(transaction);
      return gasEstimate.toString();
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
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice?.toString() || '0';
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
    console.log('EVM Service - sendMessage called');
    
    // Check if wallet is ready
    const walletReady = await this.isWalletReady();
    if (!walletReady) {
      console.log('EVM Service - Wallet not ready, attempting to reconnect...');
      // Try to reconnect
      await this.ensureProvider();
      await this.ensureSigner();
    }
    
    console.log('EVM Service - signer exists:', !!this.signer);
    console.log('EVM Service - provider exists:', !!this.provider);

    const from = await this.signer!.getAddress();
    console.log('EVM Service - from address:', from);
    
    // Get network info with retry
    let network;
    let chainId;
    try {
      network = await this.provider!.getNetwork();
      chainId = Number(network.chainId);
      console.log('EVM Service - network info:', { chainId, name: network.name });
    } catch (networkError) {
      console.warn('Failed to get network info, using default chain ID:', networkError);
      chainId = 11155111; // Default to Sepolia
    }

    // Check if we're on the right network
    if (chainId !== 11155111) {
      throw new Error(`Please switch to Sepolia testnet (Chain ID: 11155111). You are currently on Chain ID: ${chainId}`);
    }

    try {
      console.log('EVM Service - Sending message to:', recipient);
      console.log('EVM Service - Content:', content);
      console.log('EVM Service - Value:', value);
      console.log('EVM Service - Chain ID:', chainId);

      // Check balance first with network change handling
      let balance;
      try {
        balance = await this.provider!.getBalance(from);
        const balanceInEth = ethers.formatEther(balance);
        console.log('EVM Service - Current balance:', balanceInEth, 'ETH');
      } catch (balanceError) {
        if (balanceError instanceof Error && balanceError.message.includes('network changed')) {
          console.log('EVM Service - Network changed during balance check, re-initializing...');
          // Re-initialize provider and signer after network change
          await this.ensureProvider();
          await this.ensureSigner();
          // Try balance check again
          balance = await this.provider!.getBalance(from);
          const balanceInEth = ethers.formatEther(balance);
          console.log('EVM Service - Current balance after re-init:', balanceInEth, 'ETH');
        } else {
          throw balanceError;
        }
      }

      // Create transaction object
      const transaction = {
        to: recipient,
        value: ethers.parseEther(ethers.formatEther(value)),
        data: ethers.hexlify(ethers.toUtf8Bytes(content)),
      };

      console.log('EVM Service - Transaction object:', transaction);

      // Use wallet signer directly with timeout and network change handling
      console.log('EVM Service - Using wallet signer directly...');
      
      let tx;
      try {
        tx = await Promise.race([
          this.signer!.sendTransaction(transaction),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 30000)
          )
        ]) as any;
      } catch (txError) {
        if (txError instanceof Error && txError.message.includes('network changed')) {
          console.log('EVM Service - Network changed during transaction, re-initializing...');
          // Re-initialize provider and signer after network change
          await this.ensureProvider();
          await this.ensureSigner();
          // Try transaction again
          tx = await Promise.race([
            this.signer!.sendTransaction(transaction),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Transaction timeout')), 30000)
            )
          ]) as any;
        } else {
          throw txError;
        }
      }
      
      console.log('EVM Service - Transaction sent successfully:', tx.hash);

      console.log('EVM Service - Transaction sent, returning immediately...');

      // Return transaction info immediately without waiting for confirmation
      // This avoids RPC issues with waiting for confirmation
      const evmTransaction: EVMTransaction = {
        hash: tx.hash,
        from,
        to: recipient,
        value: value,
        gasUsed: '0',
        gasPrice: '0',
        timestamp: Date.now(),
        blockNumber: 0,
        status: 'pending',
      };

      return {
        hash: tx.hash,
        transaction: evmTransaction,
      };
    } catch (error) {
      console.error('Failed to send EVM message:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds for transaction');
        } else if (error.message.includes('user rejected')) {
          throw new Error('Transaction rejected by user');
        } else if (error.message.includes('gas')) {
          throw new Error('Gas estimation failed. Please try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('timeout') || error.message.includes('Request timed out')) {
          throw new Error('Transaction timed out. Please try again or check your network connection.');
        } else if (error.message.includes('network changed')) {
          throw new Error('Network changed during transaction. Please try again.');
        } else if (error.message.includes('Cannot fulfill request')) {
          throw new Error('Network error. Please try switching to a different network or try again later.');
        } else if (error.message.includes('UNKNOWN_ERROR')) {
          throw new Error('Network error. Please try again or switch to a different RPC endpoint.');
        } else {
          throw new Error(`Transaction failed: ${error.message}`);
        }
      }
      
      throw new Error('Failed to send message');
    }
  }

  async getTransactionReceipt(hash: string): Promise<EVMTransaction | null> {
    if (!this.provider) {
      throw new Error('No EVM wallet found');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(hash);

      if (!receipt) return null;

      return {
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to || '',
        value: '0', // Transaction receipt doesn't have value, it's in the transaction
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString() || '0',
        timestamp: Date.now(), // Would be calculated from block timestamp
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
      };
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      return null;
    }
  }

  formatBalance(balance: string, decimals: number = 18): string {
    const value = ethers.formatUnits(balance, decimals);
    return parseFloat(value).toFixed(6);
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getChainById(chainId: number): EVMChain | undefined {
    return SUPPORTED_EVM_CHAINS.find(chain => chain.id === chainId);
  }

  isConnected(): boolean {
    // Only consider connected if both provider and signer exist AND we have an address
    return this.signer !== null && this.provider !== null && this.currentWallet !== null;
  }

  // Check if wallet is properly connected with signer
  async isWalletReady(): Promise<boolean> {
    try {
      if (!this.signer) {
        return false;
      }
      // Try to get address to verify signer is working
      await this.signer.getAddress();
      return true;
    } catch (error) {
      console.warn('Wallet not ready:', error);
      return false;
    }
  }

  getCurrentChainId(): number | null {
    return this.currentChainId;
  }

  disconnect(): void {
    // WalletConnect removed - no cleanup needed
    this.provider = null;
    this.signer = null;
    this.currentChainId = null;
    this.currentWallet = null;
  }
}

// Export singleton instance
export const evmService = new EVMService();
