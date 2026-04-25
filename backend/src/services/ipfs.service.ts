import axios from 'axios';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export interface IPFSUploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  properties?: Record<string, unknown>;
}

export const ipfsService = {
  async uploadFile(buffer: Buffer, filename: string): Promise<IPFSUploadResult> {
    try {
      const formData = new (await import('form-data')).default();
      formData.append('file', buffer, {
        filename,
        contentType: 'application/octet-stream',
      });

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            pinata_api_key: config.ipfs.apiKey,
            pinata_secret_api_key: config.ipfs.apiSecret,
          },
        }
      );

      logger.info('File uploaded to IPFS:', {
        hash: response.data.IpfsHash,
        filename,
      });

      return response.data as IPFSUploadResult;
    } catch (error) {
      logger.error('IPFS file upload failed:', error);
      throw new AppError('Failed to upload file to IPFS', 500);
    }
  },

  async uploadJSON(metadata: IPFSMetadata): Promise<IPFSUploadResult> {
    if (!config.ipfs.apiKey || !config.ipfs.apiSecret) {
      logger.warn('IPFS not configured - using mock upload');
      return { IpfsHash: `mock_${Date.now()}`, PinSize: 0, Timestamp: new Date().toISOString() };
    }

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            pinata_api_key: config.ipfs.apiKey,
            pinata_secret_api_key: config.ipfs.apiSecret,
          },
        }
      );

      logger.info('JSON uploaded to IPFS:', {
        hash: response.data.IpfsHash,
        name: metadata.name,
      });

      return response.data as IPFSUploadResult;
    } catch (error) {
      logger.error('IPFS JSON upload failed:', error);
      throw new AppError('Failed to upload metadata to IPFS', 500);
    }
  },

  async getJSON(ipfsHash: string): Promise<IPFSMetadata | null> {
    try {
      const url = `${config.ipfs.gatewayUrl}${ipfsHash}`;
      const response = await axios.get(url);
      return response.data as IPFSMetadata;
    } catch (error) {
      logger.error('IPFS JSON fetch failed:', error);
      return null;
    }
  },

  getGatewayUrl(ipfsHash: string): string {
    return `${config.ipfs.gatewayUrl}${ipfsHash}`;
  },

  formatIPFSUrl(hash: string): string {
    if (!hash) return '';
    if (hash.startsWith('ipfs://')) {
      return hash.replace('ipfs://', config.ipfs.gatewayUrl);
    }
    if (hash.startsWith('Qm') || hash.startsWith('bafy')) {
      return `${config.ipfs.gatewayUrl}${hash}`;
    }
    return hash;
  },
};