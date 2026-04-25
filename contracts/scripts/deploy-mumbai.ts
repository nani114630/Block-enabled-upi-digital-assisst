import "dotenv/config";
import { ethers, network } from "hardhat";

/**
 * Deploy AssetNFT to Polygon Mumbai testnet
 *
 * Usage:
 * npx hardhat run scripts/deploy-mumbai.ts --network mumbai
 *
 * Environment Variables Required:
 * - MUMBAI_RPC_URL: Mumbai RPC URL
 * - PRIVATE_KEY: Deployer wallet private key
 * - POLYGONSCAN_API_KEY: Polygonscan API key (for verification)
 */
async function main() {
  console.log("===========================================");
  console.log("Deploying AssetNFT to Polygon Mumbai");
  console.log("===========================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.formatEther(balance), "MATIC\n");

  // Contract parameters
  const name = "UPI Digital Assets";
  const symbol = "UPI NFT";
  const baseURI = "https://gateway.pinata.cloud/ipfs/";
  const maxSupply = 10000;

  console.log("Contract Parameters:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Base URI:", baseURI);
  console.log("  Max Supply:", maxSupply === 0 ? "Unlimited" : maxSupply);
  console.log("");

  // Deploy contract
  console.log("Deploying AssetNFT...\n");

  const AssetNFT = await ethers.getContractFactory("AssetNFT", deployer);

  const contract = await AssetNFT.deploy(name, symbol, baseURI, maxSupply);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("===========================================");
  console.log("AssetNFT Deployed Successfully!");
  console.log("===========================================");
  console.log("Contract Address:", contractAddress);
  console.log("");

  // Verify on Polygonscan (if API key provided)
  const apiKey = process.env.POLYGONSCAN_API_KEY;
  if (apiKey) {
    console.log("\nVerifying on Polygonscan...");

    try {
      // Wait for a few blocks
      await new Promise(resolve => setTimeout(resolve, 30000));

      await (global as unknown as { run: (task: string, args: object) => Promise<void> }).run("verify:verify", {
        address: contractAddress,
        constructorArguments: [name, symbol, baseURI, maxSupply],
      });

      console.log("Contract verified on Polygonscan!");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }

  console.log("\n===========================================");
  console.log("Deployment Complete!");
  console.log("===========================================");
  console.log("\nTo verify manually:");
  console.log(`  https://mumbai.polygonscan.com/address/${contractAddress}`);
  console.log("\nTo interact with contract, update backend .env:");
  console.log(`  CONTRACT_ADDRESS=${contractAddress}`);

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });