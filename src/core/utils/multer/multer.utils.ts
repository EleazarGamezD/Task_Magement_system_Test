import { ImageDto } from '@core/common/dto/image/image.dto';
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_IMAGE_SIZE_LIMIT,
} from '@core/constants/filteTypes/file-type.constans';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';

/**
 * Creates MulterOptions configuration for file uploads
 */
export const multerConfig = (
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = DEFAULT_IMAGE_SIZE_LIMIT,
): MulterOptions => ({
  limits: {
    fileSize: maxSize,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
  storage: multer.memoryStorage(),
});

/**
 * Converts a file to base64 format with its extension
 */
export const convertFileToBase64 = (file: Express.Multer.File): ImageDto => {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  const base64Data = file.buffer.toString('base64');
  const extension = file.mimetype.split('/')[1];

  return {
    file: base64Data,
    extension,
  };
};
