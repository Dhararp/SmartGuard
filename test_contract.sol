// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TestContract {
    string public message = "Hello Modified SmartGuard";

    function updateMessage(string memory newMessage) public {
        message = newMessage;
    }
}