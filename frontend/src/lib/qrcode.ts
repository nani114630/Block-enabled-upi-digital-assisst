import QRCode from 'qrcode';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const parseQRCodeData = (qrData: string): {
  uniqueId: string;
  eventId: string;
  ticketType: string;
} | null => {
  try {
    const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};