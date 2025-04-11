import { IConfiguration } from '@app/core/config/IConfig/configuration';
import { CustomException } from '@app/core/exceptions-custom/custom-exception';
import { FileUtils } from '@app/core/utils/file/file.utils';
import { ImageDto } from '@core/common/dto/image/image.dto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export type SaveToMinioResponse = {
  response: { etag: string; versionId: string | null };
  name: string;
};

@Injectable()
export class FileService {
  private minio = {} as IConfiguration['minio'];
  constructor(private readonly configService: ConfigService) {
    this.minio = this.configService.get<IConfiguration['minio']>('minio') || {
      endPoint: undefined,
      port: undefined,
      useSSL: undefined,
      accessKey: undefined,
      secretKey: undefined,
      region: undefined,
      bucket: undefined,
    };
    this.logger.log('MinIO configuration:', this.minio);
    this.ensureBucketExists(this.MINIO_BUCKET);
  }
  private readonly MINIO_BUCKET = this.minio.bucket || 'tasks';
  private logger = new Logger(FileService.name);
  private readonly minioClient = new Minio.Client({
    port: this.minio.port || 9001,
    endPoint: this.minio.endPoint || 'localhost',
    useSSL: this.minio.useSSL || false,
    accessKey: this.minio.accessKey || 'sail',
    secretKey: this.minio.secretKey || 'password',
    region: this.minio.region || 'us-east-1',
  });

  /**
   * Saves a base64 string to MinIO.
   * @param base64Data - Data in base64 format.
   * @param type - File type (can be 'image', 'video', etc.).
   * @returns Object with MinIO response and the file name.
   */
  async saveBase64ToMinio(
    base64Data: string,
    extension: string,
    folder: string,
  ): Promise<SaveToMinioResponse> {
    if (!base64Data || !folder) {
      throw new BadRequestException('Invalid input data');
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const name = FileUtils.generateRandomString();
    const fileName = `${folder}/${FileUtils.generateRandomFileName(
      name + `.${extension}`,
    )}`;

    try {
      await this.ensureBucketExists(this.MINIO_BUCKET);

      const minioResponse = await this.minioClient.putObject(
        this.MINIO_BUCKET,
        fileName,
        fileBuffer,
      );

      this.logger.debug(minioResponse);

      return { response: minioResponse, name: fileName };
    } catch (e) {
      console.error(e);
      throw new CustomException('Error al guardar el archivo en MinIO');
    }
  }

  /**
   * Saves a base64 string to MinIO with a custom name.
   * @param base64Data - Data in base64 format.
   * @param type - File type (can be 'image', 'video', etc.).
   * @param folder - Folder where the file will be saved.
   * @param name - Name of the file to save.
   * @returns Object with MinIO response and the file name.
   */
  async saveAssetToMinio(
    base64Data: string,
    extension: string,
    name: string,
    folder: string,
  ): Promise<SaveToMinioResponse> {
    if (!base64Data || !folder) {
      throw new BadRequestException('Invalid input data');
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileName = `${folder}/${name + `.${extension}`}`;

    try {
      await this.ensureBucketExists(this.MINIO_BUCKET);

      const minioResponse = await this.minioClient.putObject(
        this.MINIO_BUCKET,
        fileName,
        fileBuffer,
      );

      this.logger.debug(minioResponse);

      return { response: minioResponse, name: fileName };
    } catch (e) {
      console.error(e);
      throw new CustomException('Error al guardar el archivo en MinIO');
    }
  }

  /**
   * Gets a presigned URL to download an image from MinIO.
   * @param objectName - The name of the object to download.
   * @returns A presigned URL to download the image, or null if there was an error.
   * @throws {Error} - If there was an error getting the image from MinIO.
   */
  async getImageUrl(objectName: string): Promise<string | undefined | null> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.MINIO_BUCKET,
        objectName,
      );
      if (!url) {
        return null;
      }
      return url;
    } catch (e) {
      console.error(e);
      throw new Error('Error getting the object from MinIO');
    }
  }

  /**
   * Gets a presigned URL to download a document from MinIO
   * @param objectName - The name of the object to download
   * @returns A presigned URL to download the document, or null if there was an error.
   * @throws {Error} - If there was an error getting the document from MinIO.
   */
  async getDocumentFromMinio(
    objectName: string,
  ): Promise<string | undefined | null> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.MINIO_BUCKET,
        objectName,
      );
      if (!url) {
        return null;
      }
      return url;
    } catch (e) {
      console.error(e);
      throw new Error('Error getting the object from MinIO');
    }
  }

  /**
   * Saves multiple images to MinIO.
   * @param images - Array of ImageDto with base64 data and extension.
   * @param folder - Folder where the images will be saved.
   * @returns Promise that resolves to an object with an array of saved image urls.
   */
  async saveMultipleImagesToMinio(
    images: ImageDto[],
    folder: string,
  ): Promise<{ urls: string[] }> {
    const promises = images.map(async (imageData) => {
      const { name } = await this.saveBase64ToMinio(
        imageData.file,
        imageData.extension,
        folder,
      );

      return name;
    });

    const results = await Promise.allSettled(promises);

    const savedImageurls = results
      .filter((result) => result.status === 'fulfilled')
      .map(
        (result) => (result as unknown as PromiseFulfilledResult<string>).value,
      );

    return { urls: savedImageurls };
  }

  /**
   * Deletes a list of images from a specified folder in MinIO.
   *
   * @param imageUrls - Array of image URLs to be deleted.
   * @param folder - Folder from which the images will be deleted.
   * @returns A Promise that resolves when all specified images are deleted.
   * @throws {Error} - If there is an error during the deletion process.
   */
  async deleteImages(imageUrls: string[], folder: string): Promise<void> {
    try {
      for (const imageUrl of imageUrls) {
        const objectName = this.getObjectNameFromUrl(imageUrl);
        if (!objectName) {
          this.logger.warn(
            `Invalid object name extracted from URL: ${imageUrl}`,
          );
          continue;
        }
        await this.minioClient.removeObject(
          this.MINIO_BUCKET,
          `${folder}/${objectName}`,
        );
        this.logger.debug(`File deleted from MinIO: ${objectName}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting File from MinIO: ${error}`);
      throw new Error('Failed to delete product files from MinIO');
    }
  }

  /**
   * Extracts the object name from the given image URL.
   *
   * @param imageUrl - The URL from which to extract the object name.
   * @returns The object name if successfully extracted, undefined or null if an error occurs.
   * @throws {Error} - If the object name cannot be extracted from the URL.
   */
  private getObjectNameFromUrl(imageUrl: string): string | undefined | null {
    try {
      const urlParts = imageUrl.split('/');
      const objectName = urlParts[urlParts.length - 1];

      if (!objectName || objectName.trim() === '') {
        throw new Error('Invalid object name extracted from URL');
      }
      return objectName;
    } catch (error) {
      this.logger.error(`Error extracting object name from URL: ${error}`);
      return null;
    }
  }

  /**
   * Verifies if a bucket exists in MinIO, and if not, creates one.
   * @param bucketName - Name of the bucket to verify/create.
   * @returns A Promise that resolves to an object with a message indicating whether the bucket was created.
   * @throws {Error} - If the bucket creation fails.
   */
  private async ensureBucketExists(bucketName: string) {
    const exists = await this.minioClient.bucketExists(bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(bucketName, 'us-east-1');
    }
    return { 'Bucket created: ': bucketName };
  }
}
