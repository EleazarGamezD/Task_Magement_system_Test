// Define allowed file types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/gif',
  'image/webp',
];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
];

// Default size limits
export const DEFAULT_IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
export const DEFAULT_DOCUMENT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const DEFAULT_VIDEO_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
