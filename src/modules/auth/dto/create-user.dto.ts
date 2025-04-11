import { ValidRoles } from '@enums/valid-roles';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    nullable: true,
    required: false,
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'User password',
    example: 'Password123',
  })
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
    nullable: true,
    required: false,
  })
  userName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User profile photo',
    type: 'string',
    format: 'binary',
    required: false,
  })
  // This should be a file upload, but for simplicity, we keep it as any
  profilePhoto?: any; //eslint-disable-line

  @IsOptional()
  @Transform(({ value }) => {
    // Handle single string value
    if (typeof value === 'string') {
      return [value];
    }
    // Handle array of strings
    if (Array.isArray(value)) {
      return value;
    }
    // Default to USER if empty
    return [ValidRoles.USER];
  })
  @IsEnum(ValidRoles, { each: true })
  @ApiProperty({
    description: 'User roles',
    enum: ValidRoles,
    isArray: false, // Changed to false so Swagger sends as string
    example: ValidRoles.USER, // Changed from array to single value
    default: ValidRoles.USER,
  })
  roles?: ValidRoles[] = [ValidRoles.USER];
}
