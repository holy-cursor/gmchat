/**
 * Merkle Tree Service for P2P Message Batching
 * Generates Merkle trees and proofs for message batches
 */

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
}

export class MerkleTreeService {
  /**
   * Create a Merkle tree from message CIDs
   */
  static createTree(messageCids: string[]): MerkleNode {
    if (messageCids.length === 0) {
      throw new Error('Cannot create tree from empty array');
    }

    // Convert CIDs to hashes
    const hashes = messageCids.map(cid => this.hashString(cid));
    
    // Build tree bottom-up
    let nodes: MerkleNode[] = hashes.map(hash => ({ hash }));
    
    while (nodes.length > 1) {
      const nextLevel: MerkleNode[] = [];
      
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = nodes[i + 1] || left; // Duplicate last node if odd number
        
        const combinedHash = this.hashString(left.hash + right.hash);
        const parent: MerkleNode = {
          hash: combinedHash,
          left,
          right
        };
        
        nextLevel.push(parent);
      }
      
      nodes = nextLevel;
    }
    
    return nodes[0];
  }

  /**
   * Get the Merkle root from a tree
   */
  static getRoot(tree: MerkleNode): string {
    return tree.hash;
  }

  /**
   * Generate a Merkle proof for a specific message CID
   */
  static generateProof(tree: MerkleNode, targetCid: string): MerkleProof | null {
    const targetHash = this.hashString(targetCid);
    const path: string[] = [];
    const indices: number[] = [];
    
    const found = this.findPath(tree, targetHash, path, indices, 0);
    
    if (!found) {
      return null;
    }
    
    return {
      leaf: targetHash,
      path: path.reverse(), // Reverse to get path from leaf to root
      indices: indices.reverse()
    };
  }

  /**
   * Verify a Merkle proof
   */
  static verifyProof(
    leaf: string,
    path: string[],
    indices: number[],
    root: string
  ): boolean {
    let currentHash = leaf;
    
    for (let i = 0; i < path.length; i++) {
      const sibling = path[i];
      const index = indices[i];
      
      if (index === 0) {
        // Current node is left child
        currentHash = this.hashString(currentHash + sibling);
      } else {
        // Current node is right child
        currentHash = this.hashString(sibling + currentHash);
      }
    }
    
    return currentHash === root;
  }

  /**
   * Create a batch ID from message CIDs
   */
  static createBatchId(messageCids: string[]): string {
    const sortedCids = [...messageCids].sort();
    const combined = sortedCids.join('');
    return this.hashString(combined);
  }

  /**
   * Find path from root to target hash
   */
  private static findPath(
    node: MerkleNode,
    targetHash: string,
    path: string[],
    indices: number[],
    currentIndex: number
  ): boolean {
    if (node.hash === targetHash) {
      return true;
    }
    
    if (node.left) {
      if (this.findPath(node.left, targetHash, path, indices, currentIndex * 2)) {
        if (node.right) {
          path.push(node.right.hash);
          indices.push(1);
        }
        return true;
      }
    }
    
    if (node.right) {
      if (this.findPath(node.right, targetHash, path, indices, currentIndex * 2 + 1)) {
        if (node.left) {
          path.push(node.left.hash);
          indices.push(0);
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Hash a string using SHA-256
   */
  private static hashString(input: string): string {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

export default MerkleTreeService;
