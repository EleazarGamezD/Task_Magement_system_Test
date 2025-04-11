import { ValidRoles } from '@enums/valid-roles';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User password',
    example: 'password123',
    required: false,
  })
  password?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Username', example: 'johndoe', required: false })
  userName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User profile photo',
    example: 'profile.jpg',
    required: false,
  })
  profilePhoto?: string;

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
