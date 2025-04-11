import { IsBase64, IsNotEmpty, IsString } from 'class-validator';

export class ImageDto {
  @IsBase64()
  @IsNotEmpty()
  file: string;

  @IsNotEmpty()
  @IsString()
  extension: string;

  name?: string;

  id?: string;
}
