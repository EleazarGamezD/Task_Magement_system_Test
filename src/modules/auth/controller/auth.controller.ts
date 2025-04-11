import { ImageDto } from '@core/common/dto/image/image.dto';
import { UserWithoutPassword } from '@core/interfaces/user.interface';
import { convertFileToBase64 } from '@core/utils/multer/multer.utils';
import { SwaggerEnum } from '@enums/swagger.enums';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { UserDecorator } from '../decorator/user/user.decorator';
import { LoginUserDto } from '../dto/auth-user-dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthGuard } from '../guards/auth/auth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiResponse({
    status: 200,
    description: 'User Created',
    type: UserWithoutPassword,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  @ApiBody({ type: CreateUserDto })
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileData: ImageDto | null = file ? convertFileToBase64(file) : null;
    return this.authService.create(createUserDto, fileData);
  }

  @Post('login')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Login Successful',
    type: UserWithoutPassword,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User Not Found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiConsumes('application/json')
  @ApiBody({ type: LoginUserDto })
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Token Refreshed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiConsumes('application/json')
  @ApiBody({ type: RefreshTokenDto })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Delete('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth(SwaggerEnum.AUTH_TOKEN)
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Logout Successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@UserDecorator() user: User) {
    return this.authService.logout(user.id);
  }

  @Patch('user')
  @UseGuards(AuthGuard)
  @ApiBearerAuth(SwaggerEnum.AUTH_TOKEN)
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'User Updated',
    type: UserWithoutPassword,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  @ApiBody({ type: UpdateUserDto })
  updateUser(
    @UserDecorator() user: User,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileData: ImageDto | null = file ? convertFileToBase64(file) : null;
    return this.authService.updateUser(user, updateUserDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth(SwaggerEnum.AUTH_TOKEN)
  @ApiResponse({
    status: 200,
    description: 'User Profile',
    type: UserWithoutPassword,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@UserDecorator() user: User) {
    return this.authService.getProfile(user);
  }
}
