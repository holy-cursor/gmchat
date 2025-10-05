// Simple IPFS connectivity test
import IPFSService from '../services/ipfsService';

export const testIPFSConnection = async (): Promise<{
  success: boolean;
  message: string;
  gateway?: string;
}> => {
  try {
    console.log('Testing IPFS connection...');
    const result = await IPFSService.uploadContent('IPFS connection test');
    console.log('IPFS test successful:', result);
    return {
      success: true,
      message: 'IPFS connection successful',
      gateway: result.url
    };
  } catch (error) {
    console.warn('IPFS test failed:', error);
    return {
      success: false,
      message: `IPFS connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Test function that can be called from browser console
(window as any).testIPFS = testIPFSConnection;
