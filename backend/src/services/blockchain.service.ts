import { ethers, Wallet, Contract } from 'ethers';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export interface MintAssetResult {
  tokenId: number;
  transactionHash: string;
  blockNumber: number;
}

export interface AssetDetails {
  tokenId: number;
  owner: string;
  metadataURI: string;
}

const CONTRACT_ABI = [
  'function mintAsset(address to, string memory metadataURI) public returns (uint256)',
  'function transferAsset(address to, uint256 tokenId) public',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function tokenURI(uint256 tokenId) public view returns (string)',
  'function getAssetDetails(uint256 tokenId) public view returns (uint256, address, string)',
  'function totalSupply() public view returns (uint256)',
  'event AssetMinted(address indexed from, uint256 tokenId, string metadataURI)',
  'event AssetTransferred(address indexed from, address indexed to, uint256 tokenId)',
];

export const blockchainService = {
  provider: null as unknown as ethers.JsonRpcProvider | null,
  wallet: null as unknown as Wallet | null,
  contract: null as unknown as Contract | null,

  async initialize(): Promise<void> {
    try {
      if (!config.contract.address || config.contract.address === '0x0000000000000000000000000000000000000000') {
        logger.info('Blockchain test mode - skipping initialization');
        return;
      }

      this.provider = new ethers.JsonRpcProvider(config.polygon.rpcUrl) as unknown as ethers.JsonRpcProvider;

      this.wallet = new Wallet(config.contract.ownerPrivateKey, this.provider) as unknown as Wallet;

      this.contract = new Contract(
        config.contract.address,
        CONTRACT_ABI,
        this.wallet
      ) as unknown as Contract;

      logger.info('Blockchain service initialized', {
        chainId: config.polygon.chainId,
        contract: config.contract.address,
        wallet: this.wallet.address,
      });
    } catch (error) {
      logger.error('Blockchain initialization failed:', error);
      throw new AppError('Failed to initialize blockchain service', 500);
    }
  },

  async mintAsset(
    to: string,
    metadataURI: string
  ): Promise<MintAssetResult> {
    try {
      if (config.contract.address === '0x0000000000000000000000000000000000000000' || !config.contract.address) {
        const mockTokenId = Math.floor(Math.random() * 10000) + 1;
        const mockHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2)}`;
        logger.info('Test mode - mock NFT minted:', { tokenId: mockTokenId, transactionHash: mockHash });
        return {
          tokenId: mockTokenId,
          transactionHash: mockHash,
          blockNumber: 0,
        };
      }

      if (!this.contract) {
        await this.initialize();
      }

      logger.info('Minting NFT:', { to, metadataURI });

      const tx = await (this.contract as Contract).mintAsset(to, metadataURI);
      const receipt = await tx.wait();

      const tokenId = await this.getLatestTokenId();

      logger.info('NFT minted successfully:', {
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt?.blockNumber,
      });

      return {
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt?.blockNumber || 0,
      };
    } catch (error) {
      logger.error('NFT minting failed:', error);
      throw new AppError('Failed to mint NFT on blockchain', 500);
    }
  },

  async transferAsset(
    to: string,
    tokenId: number
  ): Promise<string> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      logger.info('Transferring NFT:', { to, tokenId });

      const tx = await (this.contract as Contract).transferAsset(to, tokenId);
      await tx.wait();

      logger.info('NFT transferred:', {
        tokenId,
        transactionHash: tx.hash,
        from: (this.wallet as Wallet).address,
        to,
      });

      return tx.hash;
    } catch (error) {
      logger.error('NFT transfer failed:', error);
      throw new AppError('Failed to transfer NFT on blockchain', 500);
    }
  },

  async ownerOf(tokenId: number): Promise<string> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const owner = await (this.contract as Contract).ownerOf(tokenId);
      return owner;
    } catch (error) {
      logger.error('Owner query failed:', { tokenId, error });
      throw new AppError('Failed to get NFT owner', 500);
    }
  },

  async tokenURI(tokenId: number): Promise<string> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const uri = await (this.contract as Contract).tokenURI(tokenId);
      return uri;
    } catch (error) {
      logger.error('Token URI query failed:', { tokenId, error });
      throw new AppError('Failed to get token URI', 500);
    }
  },

  async getAssetDetails(tokenId: number): Promise<AssetDetails> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const result = await (this.contract as Contract).getAssetDetails(tokenId);
      return {
        tokenId: Number(result[0]),
        owner: result[1],
        metadataURI: result[2],
      };
    } catch (error) {
      logger.error('Asset details query failed:', { tokenId, error });
      throw new AppError('Failed to get asset details', 500);
    }
  },

  async getTotalSupply(): Promise<number> {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const supply = await (this.contract as Contract).totalSupply();
      return Number(supply);
    } catch (error) {
      logger.error('Total supply query failed:', error);
      return 0;
    }
  },

  async getLatestTokenId(): Promise<number> {
    const supply = await this.getTotalSupply();
    return supply;
  },

  async getBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const balance = await (this.provider as ethers.JsonRpcProvider).getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Balance query failed:', error);
      throw new AppError('Failed to get wallet balance', 500);
    }
  },

  async getTransactionReceipt(txHash: string): Promise<unknown> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const receipt = await (this.provider as ethers.JsonRpcProvider).getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      logger.error('Transaction receipt query failed:', { txHash, error });
      return null;
    }
  },
};