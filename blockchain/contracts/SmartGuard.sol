
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SmartGuard {

    struct ContractRecord {
        bytes32 codeHash;
        address owner;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => ContractRecord) public contracts;

    event ContractRegistered(
        string contractId,
        bytes32 codeHash,
        address owner,
        uint256 timestamp
    );

    function registerContract(
        string memory contractId,
        bytes32 codeHash
    ) public {
        require(bytes(contractId).length > 0, "Invalid contract ID");
        require(!contracts[contractId].exists, "Already registered");
        require(codeHash != bytes32(0), "Invalid code hash");

        contracts[contractId] = ContractRecord({
            codeHash: codeHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit ContractRegistered(
            contractId,
            codeHash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyContract(
        string memory contractId,
        bytes32 newHash
    ) public view returns (bool) {
        require(contracts[contractId].exists, "Contract not found");

        return contracts[contractId].codeHash == newHash;
    }

    function getContract(
        string memory contractId
    ) public view returns (
        bytes32,
        address,
        uint256
    ) {
        require(contracts[contractId].exists, "Contract not found");

        ContractRecord memory record = contracts[contractId];

        return (
            record.codeHash,
            record.owner,
            record.timestamp
        );
    }
}
