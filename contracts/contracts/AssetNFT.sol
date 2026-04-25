// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AssetNFT
 * @notice ERC721 NFT contract for digital asset ownership on Polygon
 * @dev Implements ERC-721 standard with URI storage and minting capabilities
 *
 * Key Features:
 * - Mint new NFTs with metadata URI
 * - Store token URIs pointing to IPFS metadata
 * - Transfer ownership
 *
 * Integration:
 * - Backend calls mintAsset() after successful payment
 * - Token URI points to IPFS JSON metadata
 * - Owner address is user's wallet address
 */
contract AssetNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    // Counter for tracking total NFTs minted
    Counters.Counter private _tokenIdCounter;

    // Maximum supply cap (0 = unlimited)
    uint256 public maxSupply;

    // Base URI for all tokens
    string private _baseTokenURI;

    // Contract metadata
    string public contractURI;

    // Events for transparency
    event AssetMinted(
        address indexed minter,
        uint256 indexed tokenId,
        string metadataURI
    );

    event AssetTransferred(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    event BaseURIUpdated(string newBaseURI);

    event MaxSupplyUpdated(uint256 newMaxSupply);

    /**
     * @notice Constructor for AssetNFT
     * @param name_ NFT collection name
     * @param symbol_ NFT collection symbol
     * @param baseURI_ Base URI for token metadata
     * @param maxSupply_ Maximum supply (0 for unlimited)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 maxSupply_
    ) ERC721(name_, symbol_) Ownable() {
        _baseTokenURI = baseURI_;
        maxSupply = maxSupply_;
        contractURI = "ipfs://contract-metadata";
    }

    /**
     * @notice Mint a new NFT to a specific address
     * @dev Called by backend after successful payment
     * @param to Address receiving the NFT
     * @param metadataURI IPFS URI for token metadata
     * @return tokenId The ID of newly minted NFT
     */
    function mintAsset(
        address to,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        // Check max supply if set
        if (maxSupply > 0) {
            require(
                _tokenIdCounter.current() < maxSupply,
                "AssetNFT: Max supply reached"
            );
        }

        // Increment and get new token ID
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Mint NFT to recipient
        _mint(to, tokenId);

        // Set token URI
        _setTokenURI(tokenId, metadataURI);

        // Emit mint event for transparency
        emit AssetMinted(to, tokenId, metadataURI);

        return tokenId;
    }

    /**
     * @notice Batch mint multiple NFTs
     * @dev Efficient minting for multiple purchases
     * @param to Address receiving the NFTs
     * @param metadataURIs Array of metadata URIs
     * @return startTokenId The starting token ID
     */
    function batchMintAsset(
        address to,
        string[] memory metadataURIs
    ) public onlyOwner returns (uint256) {
        uint256 startTokenId = _tokenIdCounter.current() + 1;

        for (uint256 i = 0; i < metadataURIs.length; i++) {
            mintAsset(to, metadataURIs[i]);
        }

        return startTokenId;
    }

    /**
     * @notice Transfer NFT with event logging
     * @dev Override ERC721 transfer to add custom event
     * @param from Current owner
     * @param to New owner
     * @param tokenId NFT ID to transfer
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        // Call parent implementation
        super.transferFrom(from, to, tokenId);

        // Emit transfer event
        emit AssetTransferred(from, to, tokenId);
    }

    /**
     * @notice Get total NFTs minted
     * @return Current supply count
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice Get token URI
     * @param tokenId NFT ID
     * @return Token metadata URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Get base URI
     * @return Base URI string
     */
    function _baseURI() internal view override(ERC721) returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Burn NFT internal function
     * @param tokenId NFT ID to burn
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Admin Functions

    /**
     * @notice Set base URI for all tokens
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Set maximum supply
     * @param newMaxSupply New maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(
            newMaxSupply < maxSupply || maxSupply == 0,
            "AssetNFT: Can only decrease max supply"
        );
        require(
            newMaxSupply >= _tokenIdCounter.current(),
            "AssetNFT: Already minted more than new supply"
        );
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /**
     * @notice Set contract metadata URI
     * @param newContractURI New contract URI
     */
    function setContractURI(string memory newContractURI) public onlyOwner {
        contractURI = newContractURI;
    }

    // Required overrides

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}