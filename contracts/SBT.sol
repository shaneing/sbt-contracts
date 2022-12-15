// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC5192.sol";
import "./interfaces/IERC5484.sol";

contract SBT is ERC721, ERC721Enumerable, Ownable {
    string private baseURI;

    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) {
        baseURI = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // Mapping from token ID to locked status
    mapping(uint256 => bool) _locked;

    // Mapping from token ID to BurnAuth
    mapping(uint256 => BurnAuth) _burnAuth;

    /// @notice Emitted when the locking status is changed to locked.
    /// @dev If a token is minted and the status is locked, this event should be emitted.
    /// @param tokenId The identifier for a token.
    event Locked(uint256 tokenId);

    /// @notice Emitted when the locking status is changed to unlocked.
    /// @notice currently SBT Contract does not emit Unlocked event
    /// @dev If a token is minted and the status is unlocked, this event should be emitted.
    /// @param tokenId The identifier for a token.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of an Soulbound Token
    /// @dev SBTs assigned to zero address are considered invalid, and queries
    /// about them do throw.
    /// @param tokenId The identifier for an SBT.
    function locked(uint256 tokenId) external view returns (bool) {
        require(ownerOf(tokenId) != address(0));
        return _locked[tokenId];
    }

    /// A guideline to standardlize burn-authorization's number coding
    enum BurnAuth {
        IssuerOnly,
        OwnerOnly,
        Both,
        Neither
    }

    /// @notice Emitted when a soulbound token is issued.
    /// @dev This emit is an add-on to nft's transfer emit in order to distinguish sbt
    /// from vanilla nft while providing backward compatibility.
    /// @param from The issuer
    /// @param to The receiver
    /// @param tokenId The id of the issued token
    event Issued (
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        BurnAuth burnAuth
    );

    /// @notice provides burn authorization of the token id.
    /// @dev unassigned tokenIds are invalid, and queries do throw
    /// @param tokenId The identifier for a token.
    function burnAuth(uint256 tokenId) external view returns (BurnAuth) {
        require(ERC721.ownerOf(tokenId) != address(0));
        return _burnAuth[tokenId];
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        require(balanceOf(to) == 0, "MNT01");
        require(_locked[tokenId] != true, "MNT02");

        _locked[tokenId] = true;
        _burnAuth[tokenId] = BurnAuth.Both;
        emit Locked(tokenId);

        _safeMint(to, tokenId);
        emit Issued(_msgSender(), to, tokenId, BurnAuth.Both);
    }

    /// @notice Emitted when a soulbound token is burned.
    /// @dev This emit is an add-on to nft's transfer emit in order to distinguish sbt 
    /// from vanilla nft while providing backward compatibility.
    /// @param from The revoker
    /// @param tokenId The id of the issued token
    event Burned (
        address indexed from,
        uint256 indexed tokenId,
        BurnAuth burnAuth
    );
    
    function revoke(uint256 tokenId) public onlyOwner {
        require(ownerOf(tokenId) != address(0));
        require(_burnAuth[tokenId] == BurnAuth.IssuerOnly|| _burnAuth[tokenId] == BurnAuth.Both);

        _burn(tokenId);

        emit Burned(_msgSender(), tokenId, _burnAuth[tokenId]);
    }

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) != address(0));
        require(_burnAuth[tokenId] == BurnAuth.OwnerOnly|| _burnAuth[tokenId] == BurnAuth.Both);
        require(ERC721.ownerOf(tokenId) == _msgSender());

        _burn(tokenId);

        emit Burned(_msgSender(), tokenId, _burnAuth[tokenId]);
    }

    modifier IsTransferAllowed(uint256 tokenId) {
        require(!_locked[tokenId]);
        _;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public virtual override(IERC721, ERC721) IsTransferAllowed(tokenId) {
        super.safeTransferFrom(
            from,
            to,
            tokenId
        );
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    )
        public virtual override(IERC721, ERC721) IsTransferAllowed(tokenId) {
        super.safeTransferFrom(
            from,
            to,
            tokenId,
            data
        );
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public virtual override(IERC721, ERC721) IsTransferAllowed(tokenId) {
        super.safeTransferFrom(
            from,
            to,
            tokenId
        );
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 _interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return _interfaceId == type(IERC5192).interfaceId ||
            super.supportsInterface(_interfaceId);
    }

}
