import * as crypto from 'crypto';

export class FileUtils {
  static generateRandomFileName(originalName: string): string {
    const randomString = crypto.randomBytes(16).toString('hex');
    const fileExtension = originalName.split('.').pop(); // Obtener la extensión del archivo

    return `${randomString}.${fileExtension}`;
  }

  /**
   * Generates a random string of characters.
   * @param length - Desired length of the string.
   * @returns Random string of characters.
   */
  static generateRandomString(length: number = 10): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);

      result += characters.charAt(randomIndex);
    }

    return result;
  }

  /**
   * Extracts the first 8 characters from a string with the expected format "12345678-9".
   * @param {string} input - The input string to process.
   * @returns {string | null} The first 8 characters or null if the format is not valid.
   */
  static extractFirstEightCharacters(input: string): string {
    const response = input.split('-')[0];
    return response;
  }
}
