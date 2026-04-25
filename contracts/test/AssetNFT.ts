import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("AssetNFT", () => {
  let assetNFT: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;

  const NAME = "Test NFT";
  const SYMBOL = "TNFT";
  const BASE_URI = "https://example.com/ipfs/";
  const MAX_SUPPLY = 100;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const AssetNFT = await ethers.getContractFactory("AssetNFT");
    assetNFT = await AssetNFT.deploy(NAME, SYMBOL, BASE_URI, MAX_SUPPLY);
    await assetNFT.waitForDeployment();
  });

  describe("Deployment", () => {
    it("should set correct name", async () => {
      expect(await assetNFT.name()).to.equal(NAME);
    });

    it("should set correct symbol", async () => {
      expect(await assetNFT.symbol()).to.equal(SYMBOL);
    });

    it("should start with zero supply", async () => {
      expect(await assetNFT.totalSupply()).to.equal(0);
    });

    it("should set max supply", async () => {
      expect(await assetNFT.maxSupply()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Minting", () => {
    it("should mint NFT to valid recipient", async () => {
      const user1Address = await user1.getAddress();
      const tokenId = 1;

      await assetNFT.mintAsset(user1Address, "QmHash1");

      expect(await assetNFT.ownerOf(tokenId)).to.equal(user1Address);
      expect(await assetNFT.totalSupply()).to.equal(1);
    });

    it("should set token URI", async () => {
      const user1Address = await user1.getAddress();
      const tokenId = 1;
      const metadataURI = "QmTestHash";

      await assetNFT.mintAsset(user1Address, metadataURI);

      expect(await assetNFT.tokenURI(tokenId)).to.equal(metadataURI);
    });

    it("should emit AssetMinted event", async () => {
      const user1Address = await user1.getAddress();

      const tx = await assetNFT.mintAsset(user1Address, "QmHash1");
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        log => log.topics[0] === ethers.id("AssetMinted(address,uint256,string)")
      );

      expect(event).to.exist;
    });

    it("should increment token ID", async () => {
      const user1Address = await user1.getAddress();

      await assetNFT.mintAsset(user1Address, "QmHash1");
      await assetNFT.mintAsset(user1Address, "QmHash2");

      expect(await assetNFT.totalSupply()).to.equal(2);
    });
  });

  describe("Transfers", () => {
    it("should transfer NFT to new owner", async () => {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await assetNFT.mintAsset(user1Address, "QmHash1");
      await assetNFT
        .connect(owner)
        .transferFrom(user1Address, user2Address, 1);

      expect(await assetNFT.ownerOf(1)).to.equal(user2Address);
    });

    it("should emit AssetTransferred event", async () => {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await assetNFT.mintAsset(user1Address, "QmHash1");
      const tx = await assetNFT
        .connect(owner)
        .transferFrom(user1Address, user2Address, 1);
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        log => log.topics[0] === ethers.id("AssetTransferred(address,address,uint256)")
      );

      expect(event).to.exist;
    });
  });

  describe("Burning", () => {
    it("should burn NFT", async () => {
      const user1Address = await user1.getAddress();

      await assetNFT.mintAsset(user1Address, "QmHash1");
      await assetNFT.connect(user1Address).burn(1);

      await expect(assetNFT.ownerOf(1)).to.be.reverted;
    });
  });

  describe("Supply Limits", () => {
    it("should enforce max supply", async () => {
      const AssetNFTSmall = await ethers.getContractFactory("AssetNFT");
      const smallNFT = await AssetNFTSmall.deploy("Small", "S", BASE_URI, 2);

      const user1Address = await user1.getAddress();

      await smallNFT.mintAsset(user1Address, "QmHash1");
      await smallNFT.mintAsset(user1Address, "QmHash2");

      await expect(smallNFT.mintAsset(user1Address, "QmHash3")).to.be.revertedWith(
        "AssetNFT: Max supply reached"
      );
    });
  });
});