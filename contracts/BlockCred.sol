// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BlockCred {
    struct Certificate {
        string id;
        string hash;
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;

    event CertificateIssued(string id, string hash, address indexed issuer);

    constructor() {
        authorizedIssuers[msg.sender] = true;
    }

    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    function authorizeIssuer(address issuer) public {
        // Simple authorization for demo. In production, this would be more secure.
        authorizedIssuers[issuer] = true;
    }

    function issueCertificate(string memory _id, string memory _hash) public onlyAuthorized {
        require(!certificates[_id].exists, "Certificate with this ID already exists");
        
        certificates[_id] = Certificate({
            id: _id,
            hash: _hash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit CertificateIssued(_id, _hash, msg.sender);
    }

    function verifyCertificate(string memory _id) public view returns (string memory, address, uint256) {
        require(certificates[_id].exists, "Certificate does not exist");
        Certificate memory cert = certificates[_id];
        return (cert.hash, cert.issuer, cert.timestamp);
    }
}
