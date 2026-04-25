import "dotenv/config";
import { ethers } from "hardhat";

/**
 * Deploy AssetNFT to Polygon Mainnet
 *
 * Usage:
 * npx hardhat run scripts/deploy-mainnet.ts --network polygon
 *
 * WARNING: This costs real MATIC!
 */
async function main() {
  console.log("===========================================");
  console.log("Deploying AssetNFT to Polygon Mainnet");
  console.log("===========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.formatEther(balance), "MATIC\n");

  if (balance < ethers.parseEther("0.1")) {
    console.error("Insufficient balance! Need at least 0.1 MATIC");
    process.exit(1);
  }

  const name = "UPI Digital Assets";
  const symbol = "UPI NFT";
  const baseURI = "https://gateway.pinata.cloud/ipfs/";
  const maxSupply = 100000;

  console.log("Deploying AssetNFT to mainnet...\n");

  const AssetNFT = await ethers.getContractFactory("AssetNFT");
  const contract = await AssetNFT.deploy(name, symbol, baseURI, maxSupply);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("===========================================");
  console.log("AssetNFT Deployed to Polygon Mainnet!");
  console.log("===========================================");
  console.log("Contract Address:", contractAddress);
  console.log("\nhttps://polygonscan.com/address/" + contractAddress);
  console.log("\nUpdate backend .env with:");
  console.log(`  CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });