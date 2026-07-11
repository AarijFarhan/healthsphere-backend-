import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
      api_key: process.env.CLOUDINARY_API_KEY || 'demo',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'healthsphere/documents',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          access_mode: 'authenticated',
          type: 'upload',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadFromUrl(url: string, folder = 'healthsphere/documents') {
    return cloudinary.uploader.upload(url, { folder, resource_type: 'auto' });
  }

  async deleteFile(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }

  async generateSignedUrl(publicId: string, expiresIn = 3600): Promise<string> {
    return cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'image',
      type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
  }

  getOptimizedUrl(publicId: string, options?: { width?: number; height?: number; quality?: string }): string {
    const transformations: string[] = [];
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) transformations.push(`q_${options.quality}`);
    transformations.push('f_auto');

    const txString = transformations.join(',');
    return cloudinary.url(publicId, {
      transformation: txString,
      secure: true,
    });
  }
}
