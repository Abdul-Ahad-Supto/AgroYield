// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title IdentityRegistry
 * @dev Manages decentralized identities and verifiable credentials for farmers and participants
 */
contract IdentityRegistry is AccessControl {
    using ECDSA for bytes32;
    
    // Role definitions
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Credential types
    enum CredentialType {
        LAND_OWNERSHIP,
        CROP_HISTORY,
        CREDIT_HISTORY,
        KYC_VERIFICATION,
        OTHER
    }
    
    // Credential status
    enum CredentialStatus { ACTIVE, REVOKED, EXPIRED }
    
    // Verifiable Credential structure (simplified for MVP)
    struct VerifiableCredential {
        bytes32 id; // Unique identifier for the credential
        address subject; // DID of the credential subject
        CredentialType credType;
        string ipfsHash; // IPFS hash of the credential data
        address issuer; // DID of the issuer
        uint256 issuanceDate;
        uint256 expirationDate;
        CredentialStatus status;
    }
    
    // Decentralized Identity structure
    struct Identity {
        address owner;
        bool isActive;
        bytes32[] credentials; // Array of credential IDs
        mapping(bytes32 => bool) hasCredential; // Quick lookup for credentials
    }
    
    // State variables
    mapping(address => Identity) public identities;
    mapping(bytes32 => VerifiableCredential) public credentials;
    mapping(address => bool) public registeredDIDs;
    
    // Events
    event DIDRegistered(address indexed did, address owner);
    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed subject,
        CredentialType credType,
        address issuer
    );
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new decentralized identity (DID)
     */
    function registerDID() external {
        require(!registeredDIDs[msg.sender], "DID already registered");
        
        Identity storage identity = identities[msg.sender];
        identity.owner = msg.sender;
        identity.isActive = true;
        
        registeredDIDs[msg.sender] = true;
        
        emit DIDRegistered(msg.sender, msg.sender);
    }
    
    /**
     * @dev Issue a new verifiable credential
     */
    function issueCredential(
        address subject,
        CredentialType credType,
        string memory ipfsHash,
        uint256 validityPeriod
    ) external onlyRole(ISSUER_ROLE) returns (bytes32) {
        require(registeredDIDs[subject], "Subject DID not registered");
        
        bytes32 credentialId = keccak256(
            abi.encodePacked(
                subject,
                credType,
                block.timestamp,
                ipfsHash,
                msg.sender
            )
        );
        
        VerifiableCredential storage cred = credentials[credentialId];
        cred.id = credentialId;
        cred.subject = subject;
        cred.credType = credType;
        cred.ipfsHash = ipfsHash;
        cred.issuer = msg.sender;
        cred.issuanceDate = block.timestamp;
        cred.expirationDate = block.timestamp + validityPeriod;
        cred.status = CredentialStatus.ACTIVE;
        
        // Add to subject's identity
        Identity storage subjectIdentity = identities[subject];
        subjectIdentity.credentials.push(credentialId);
        subjectIdentity.hasCredential[credentialId] = true;
        
        emit CredentialIssued(credentialId, subject, credType, msg.sender);
        
        return credentialId;
    }
    
    /**
     * @dev Revoke a credential
     */
    function revokeCredential(bytes32 credentialId) external onlyRole(ISSUER_ROLE) {
        VerifiableCredential storage cred = credentials[credentialId];
        require(cred.issuer == msg.sender, "Not the issuer of this credential");
        require(cred.status == CredentialStatus.ACTIVE, "Credential not active");
        
        cred.status = CredentialStatus.REVOKED;
        
        emit CredentialRevoked(credentialId, msg.sender);
    }
    
    /**
     * @dev Verify a credential's validity
     */
    function verifyCredential(bytes32 credentialId) external view returns (bool) {
        VerifiableCredential storage cred = credentials[credentialId];
        
        return (
            cred.status == CredentialStatus.ACTIVE &&
            cred.expirationDate > block.timestamp
        );
    }
    
    /**
     * @dev Get credentials for a DID
     */
    function getCredentials(address did) external view returns (bytes32[] memory) {
        return identities[did].credentials;
    }
    
    /**
     * @dev Get credential details
     */
    function getCredential(bytes32 credentialId) external view returns (
        bytes32 id,
        address subject,
        CredentialType credType,
        string memory ipfsHash,
        address issuer,
        uint256 issuanceDate,
        uint256 expirationDate,
        CredentialStatus status
    ) {
        VerifiableCredential storage cred = credentials[credentialId];
        return (
            cred.id,
            cred.subject,
            cred.credType,
            cred.ipfsHash,
            cred.issuer,
            cred.issuanceDate,
            cred.expirationDate,
            cred.status
        );
    }
}
