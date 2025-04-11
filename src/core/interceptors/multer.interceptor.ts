import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_IMAGE_SIZE_LIMIT,
} from '@core/constants/filteTypes/file-type.constans';
import { multerConfig } from '@core/utils/multer/multer.utils';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

/**
 * Creates a FileInterceptor with validation for a single file
 * @param fieldName - Name of the form field that holds the file
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns NestJS interceptor for single file uploads
 */
export const SingleFileInterceptor = (
  fieldName: string = 'file',
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = DEFAULT_IMAGE_SIZE_LIMIT,
) => {
  return FileInterceptor(fieldName, multerConfig(allowedTypes, maxSize));
};

/**
 * Creates a FilesInterceptor with validation for multiple files
 * @param fieldName - Name of the form field that holds the files
 * @param maxCount - Maximum number of files allowed
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns NestJS interceptor for multiple file uploads
 */
export const MultipleFilesInterceptor = (
  fieldName: string = 'files',
  maxCount: number = 10,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = DEFAULT_IMAGE_SIZE_LIMIT,
) => {
  return FilesInterceptor(
    fieldName,
    maxCount,
    multerConfig(allowedTypes, maxSize),
  );
};
