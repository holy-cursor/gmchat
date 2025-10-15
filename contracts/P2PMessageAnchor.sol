// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title P2PMessageAnchor
 * @dev Base contract for anchoring P2P message batches
 * @notice Minimal contract for storing Merkle roots of message batches
 */
contract P2PMessageAnchor {
    // Events
    event BatchAnchored(
        bytes32 indexed batchId,
        bytes32 merkleRoot,
        uint256 messageCount,
        uint256 timestamp,
        address indexed sender
    );

    event MessageVerified(
        bytes32 indexed messageId,
        bytes32 indexed batchId,
        bool verified
    );

    // Structs
    struct BatchAnchor {
        bytes32 batchId;
        bytes32 merkleRoot;
        uint256 messageCount;
        uint256 timestamp;
        address sender;
        uint256 blockNumber;
    }

    struct MessageProof {
        bytes32 messageId;
        bytes32[] merkleProof;
        uint256 index;
    }

    // State variables
    mapping(bytes32 => BatchAnchor) public batches;
    mapping(bytes32 => bool) public verifiedMessages;
    
    uint256 public totalBatches;
    uint256 public totalMessages;
    
    address public owner;
    uint256 public version;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        version = 1;
    }

    /**
     * @dev Anchor a batch of messages by storing the Merkle root
     * @param batchId Unique identifier for the batch
     * @param merkleRoot Merkle root of all message CIDs in the batch
     * @param messageCount Number of messages in the batch
     */
    function anchorBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 messageCount
    ) external {
        require(batchId != bytes32(0), "Invalid batch ID");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(messageCount > 0, "Message count must be greater than 0");
        require(batches[batchId].batchId == bytes32(0), "Batch already exists");

        BatchAnchor memory newBatch = BatchAnchor({
            batchId: batchId,
            merkleRoot: merkleRoot,
            messageCount: messageCount,
            timestamp: block.timestamp,
            sender: msg.sender,
            blockNumber: block.number
        });

        batches[batchId] = newBatch;
        totalBatches++;
        totalMessages += messageCount;

        emit BatchAnchored(
            batchId,
            merkleRoot,
            messageCount,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Verify a message exists in a batch using Merkle proof
     * @param messageId Unique identifier for the message
     * @param batchId Batch containing the message
     * @param proof Merkle proof for the message
     * @param index Index of the message in the batch
     * @return verified True if message is verified
     */
    function verifyMessage(
        bytes32 messageId,
        bytes32 batchId,
        bytes32[] calldata proof,
        uint256 index
    ) external returns (bool verified) {
        require(batches[batchId].batchId != bytes32(0), "Batch does not exist");
        require(!verifiedMessages[messageId], "Message already verified");

        bytes32 merkleRoot = batches[batchId].merkleRoot;
        bytes32 computedHash = messageId;

        // Verify Merkle proof
        for (uint256 i = 0; i < proof.length; i++) {
            if (index % 2 == 0) {
                computedHash = keccak256(abi.encodePacked(computedHash, proof[i]));
            } else {
                computedHash = keccak256(abi.encodePacked(proof[i], computedHash));
            }
            index = index / 2;
        }

        verified = (computedHash == merkleRoot);
        
        if (verified) {
            verifiedMessages[messageId] = true;
        }

        emit MessageVerified(messageId, batchId, verified);
        return verified;
    }

    /**
     * @dev Get batch information
     * @param batchId Batch identifier
     * @return BatchAnchor struct containing batch details
     */
    function getBatch(bytes32 batchId) external view returns (BatchAnchor memory) {
        require(batches[batchId].batchId != bytes32(0), "Batch does not exist");
        return batches[batchId];
    }

    /**
     * @dev Check if a message has been verified
     * @param messageId Message identifier
     * @return verified True if message is verified
     */
    function isMessageVerified(bytes32 messageId) external view returns (bool) {
        return verifiedMessages[messageId];
    }

    /**
     * @dev Get contract statistics
     * @return _totalBatches Total number of batches
     * @return _totalMessages Total number of messages
     * @return _version Contract version
     */
    function getStats() external view returns (
        uint256 _totalBatches,
        uint256 _totalMessages,
        uint256 _version
    ) {
        return (totalBatches, totalMessages, version);
    }

    /**
     * @dev Update contract version (owner only)
     * @param newVersion New version number
     */
    function updateVersion(uint256 newVersion) external onlyOwner {
        require(newVersion > version, "Version must be greater than current");
        version = newVersion;
    }

    /**
     * @dev Transfer ownership (owner only)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    /**
     * @dev Emergency function to pause contract (owner only)
     * @notice This would require implementing a pause mechanism
     */
    function emergencyPause() external onlyOwner {
        // Implementation would depend on specific requirements
        revert("Emergency pause not implemented");
    }
}
