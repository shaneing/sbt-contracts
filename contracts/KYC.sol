// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;

import "./interfaces/IERC165.sol";

contract KYC {
    uint64 private count;
    address private issuer;

    constructor(address _issuer) {
      issuer = _issuer;
    }

    function inc() public IsKYC(msg.sender) {
      count += 1;
    }

    function getCount() public view returns (uint64) {
      return count;
    }

    modifier IsKYC(address holder) {
      bool success;
      bytes memory data;

      require(ERC165(issuer).supportsInterface(0xb45a3c0e), "Doesn't implement interface 0xb45a3c0e(IERC5192)");

      (success, data) = issuer.staticcall(abi.encodeWithSignature("balanceOf(address)", holder));
      require(success, "Failed to call balanceOf");
      require(abi.decode(data, (uint256)) == 1, "No KYC");
      _;
    }
}

