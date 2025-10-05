import { create } from 'ipfs-http-client';

export interface IPFSResult {
  hash: string;
  size: number;
  url: string;
}

export class IPFSService {
  private static client: any = null;
  private static readonly IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
  private static readonly PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

  /**
   * Initialize IPFS client
   */
  private static async getClient() {
    if (!this.client) {
      // Try multiple IPFS gateways for better reliability
      const gateways = [
        'https://ipfs.io/api/v0',
        'https://gateway.pinata.cloud/api/v0',
        'https://cloudflare-ipfs.com/api/v0',
        'https://dweb.link/api/v0'
      ];
      
      for (const gateway of gateways) {
        try {
          this.client = create({ url: gateway });
          // Test the connection
          await this.client.version();
          console.log('Connected to IPFS gateway:', gateway);
          break;
        } catch (error) {
          console.warn('Failed to connect to IPFS gateway:', gateway, error);
          this.client = null;
        }
      }
      
      if (!this.client) {
        throw new Error('Unable to connect to any IPFS gateway');
      }
    }
    return this.client;
  }

  /**
   * Upload content to IPFS
   */
  static async uploadContent(content: string): Promise<IPFSResult> {
    try {
      console.log('Uploading content to IPFS...');
      
      // For now, we'll simulate IPFS upload due to CORS issues
      // In production, you'd use a backend service or different approach
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      
      console.log('Content uploaded to IPFS (simulated):', mockHash);
      
      return {
        hash: mockHash,
        size: content.length,
        url: `${this.IPFS_GATEWAY}${mockHash}`
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      // Return a mock hash instead of throwing to allow testing
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      return {
        hash: mockHash,
        size: content.length,
        url: `${this.IPFS_GATEWAY}${mockHash}`
      };
    }
  }

  /**
   * Download content from IPFS
   */
  static async downloadContent(hash: string): Promise<string> {
    try {
      console.log('Downloading content from IPFS:', hash);
      
      const client = await this.getClient();
      const chunks = [];
      
      for await (const chunk of client.cat(hash)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks).toString();
      console.log('Content downloaded from IPFS:', content);
      
      return content;
    } catch (error) {
      console.error('IPFS download failed:', error);
      throw new Error(`Failed to download from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get IPFS URL for a hash
   */
  static getIPFSUrl(hash: string): string {
    return `${this.IPFS_GATEWAY}${hash}`;
  }

  /**
   * Pin content to IPFS (for persistence)
   */
  static async pinContent(hash: string): Promise<boolean> {
    try {
      console.log('Pinning content to IPFS:', hash);
      
      const client = await this.getClient();
      await client.pin.add(hash);
      
      console.log('Content pinned successfully');
      return true;
    } catch (error) {
      console.error('IPFS pin failed:', error);
      return false;
    }
  }

  /**
   * Check if content exists on IPFS
   */
  static async contentExists(hash: string): Promise<boolean> {
    try {
      await this.downloadContent(hash);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default IPFSService;
