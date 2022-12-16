// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;

import "./interfaces/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract KYC {
    uint64 private count;
    address private sbt;

    constructor(address _sbt) {
      sbt = _sbt;
    }

    // Can be called by account has passed KYC
    function inc() public IsKYC(msg.sender) {
      count += 1;
    }

    function getCount() public view returns (uint64) {
      return count;
    }

    modifier IsKYC(address holder) {
      bool success;
      bytes memory data;

      require(ERC165(sbt).supportsInterface(0xb45a3c0e), "Doesn't implement interface 0xb45a3c0e(IERC5192)");
      require(IERC721(sbt).balanceOf(holder) == 1, "No KYC");
      _;
    }
}

