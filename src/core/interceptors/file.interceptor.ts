import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_IMAGE_SIZE_LIMIT,
} from '@core/constants/filteTypes/file-type.constans';
import { multerConfig } from '@core/utils/multer/multer.utils';
import { FileInterceptor } from '@nestjs/platform-express';

export const SingleFileInterceptor = (
  fieldName: string = 'fileInterceptor',
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = DEFAULT_IMAGE_SIZE_LIMIT,
) => {
  return FileInterceptor(fieldName, multerConfig(allowedTypes, maxSize));
};
