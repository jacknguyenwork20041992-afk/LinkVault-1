import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  // Upload image file to Cloudinary
  async uploadImage(file: Buffer, filename: string, folder: string = 'support-tickets'): Promise<string> {
    try {
      console.log(`Uploading image ${filename} to Cloudinary folder: ${folder}`);
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`, // Remove extension
            resource_type: 'image',
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Failed to upload image: ${error.message}`));
            } else if (result) {
              console.log('Image uploaded successfully:', result.secure_url);
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const readableStream = new Readable();
        readableStream.push(file);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Upload file (Excel, PDF, etc.) to Cloudinary
  async uploadFile(file: Buffer, filename: string, folder: string = 'account-requests'): Promise<string> {
    try {
      console.log(`Uploading file ${filename} to Cloudinary folder: ${folder}`);
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`, // Remove extension
            resource_type: 'raw', // For non-image files
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Failed to upload file: ${error.message}`));
            } else if (result) {
              console.log('File uploaded successfully:', result.secure_url);
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const readableStream = new Readable();
        readableStream.push(file);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete file from Cloudinary
  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = url.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const publicId = `${folder}/${fileNameWithExt.split('.')[0]}`;
      
      console.log('Deleting from Cloudinary, public_id:', publicId);
      
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Delete result:', result);
      
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      return false;
    }
  }

  // Get optimized image URL with transformations
  getOptimizedImageUrl(url: string, width?: number, height?: number, quality: string = 'auto'): string {
    try {
      if (!url.includes('cloudinary.com')) {
        return url; // Return original URL if not from Cloudinary
      }

      // Extract public_id from URL
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex === -1) return url;

      const publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // Remove extension

      // Build transformation string
      let transformation = `q_${quality}`;
      if (width) transformation += `,w_${width}`;
      if (height) transformation += `,h_${height}`;
      if (width || height) transformation += ',c_fit';

      return cloudinary.url(publicId, {
        transformation: transformation,
        secure: true,
      });
    } catch (error) {
      console.error('Error generating optimized URL:', error);
      return url; // Return original URL on error
    }
  }
}

export const cloudinaryService = new CloudinaryService();