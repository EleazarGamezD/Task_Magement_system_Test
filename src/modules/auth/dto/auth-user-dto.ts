import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'user Email (unique) ',
    nullable: true,
    required: false,
    minLength: 1,
    example: 'user@example.com',
  })
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({
    description: 'userName ',
    nullable: true,
    required: false,
    minLength: 1,
    example: 'regularuser',
  })
  @IsString()
  @IsOptional()
  userName: string;

  @ApiProperty({
    description: 'User Password,The password',
    nullable: false,
    minLength: 6,
    maxLength: 50,
    example: 'Password123',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
