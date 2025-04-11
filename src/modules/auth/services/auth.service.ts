import { ImageDto } from '@core/common/dto/image/image.dto';
import {
  EMAIL_ALREADY_EXISTS,
  PASSWORD_IS_INVALID,
  PASSWORD_IS_REQUIRED,
  USER_EXIST,
  USER_NOT_ACTIVE,
  USER_NOT_FOUND,
  USERNAME_ALREADY_EXISTS,
} from '@core/constants/messages/user/user.messages';
import { CustomException } from '@core/exceptions-custom/custom-exception';
import { JwtPayload } from '@core/interfaces/jwt-payload.interface';
import { parseExpirationDate } from '@core/utils/expTime/expirationTime.utils';
import { BucketFolders } from '@enums/bucket-folders';
import { TokenRepository } from '@modules/shared/database/shared/repositories/token.repository';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { FileService } from '@modules/shared/files/file.service';
import { NotificationService } from '@modules/shared/notification/service/notification.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../shared/database/shared/repositories/user.repository';
import { LoginUserDto } from '../dto/auth-user-dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new user in the database and generate access and refresh tokens.
   *
   * @param createUserDto The data of the user to create.
   * @param fileData The file data of the user's profile photo.
   * @returns The created user without the password and the generated tokens.
   * @throws {Error} If the password is not provided.
   * @throws {CustomException} If the user already exists or if there is an error creating the user.
   */
  async create(createUserDto: CreateUserDto, fileData?: ImageDto | null) {
    try {
      const { password, email, userName, ...userData } = createUserDto;

      if (!password) {
        throw new Error(PASSWORD_IS_REQUIRED);
      }
      const existingUser = await this.userRepository.findUser(email, userName);

      if (existingUser) {
        throw new CustomException(USER_EXIST);
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      let filename = '';

      if (fileData) {
        const folder = BucketFolders.PROFILE_PHOTO;
        const { name } = await this.fileService.saveBase64ToMinio(
          fileData.file,
          fileData.extension,
          folder,
        );
        filename = name;
      }

      const newUser = this.userRepository.create({
        ...userData,
        email,
        userName,
        password: hashedPassword,
        profilePhoto: filename,
      });

      await this.userRepository.save(newUser);

      // Notify admins about the new user registration
      await this.notificationService.notifyNewUser(newUser);

      // Generate access and refresh tokens
      const tokens = await this.generateTokens(newUser.id);

      if (newUser.profilePhoto) {
        newUser.profilePhoto = (await this.fileService.getImageUrl(
          newUser.profilePhoto,
        )) as string;
      }

      const { password: _, ...userWithoutPassword } = newUser;
      return { ...userWithoutPassword, ...tokens };
    } catch (error) {
      throw new CustomException(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Validate user credentials and return user data without password and tokens.
   *
   * @param loginDto The data to validate the user.
   * @returns The user data without password and the generated tokens.
   * @throws {CustomException} If the user doesn't exist or the password is invalid.
   */
  async login(loginDto: LoginUserDto) {
    const { email, userName, password } = loginDto;

    const user = await this.userRepository.findUser(email, userName);

    if (!user) {
      throw new CustomException(USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new CustomException(USER_NOT_ACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new CustomException(PASSWORD_IS_INVALID);
    }

    const tokens = await this.generateTokens(user.id);

    if (user.profilePhoto) {
      user.profilePhoto = (await this.fileService.getImageUrl(
        user.profilePhoto,
      )) as string;
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Removes all refresh tokens associated with the given user ID.
   *
   * @param userId The ID of the user to log out.
   * @returns An object with a message indicating the logout was successful.
   */
  async logout(userId: string) {
    await this.tokenRepository.delete({ userId });

    return { message: 'Logout successful' };
  }

  /**
   * Updates a user in the database.
   *
   * @param user The user to update.
   * @param updateUserDto The data to update the user with.
   * @param fileData The file data of the user's profile photo.
   * @returns The updated user without the password.
   * @throws {CustomException} If the user doesn't exist or if there is an error updating the user.
   */
  async updateUser(
    user: User,
    updateUserDto: UpdateUserDto,
    fileData?: ImageDto | null,
  ) {
    if (!user) {
      throw new CustomException(USER_NOT_FOUND);
    }

    if (updateUserDto.password) {
      updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    let filename = '';

    if (fileData) {
      const folder = BucketFolders.PROFILE_PHOTO;

      // Delete the old profile photo if it exists
      if (user.profilePhoto) {
        await this.fileService.deleteImages([user.profilePhoto], folder);
      }

      const { name } = await this.fileService.saveBase64ToMinio(
        fileData.file,
        fileData.extension,
        folder,
      );
      filename = name;
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new CustomException(EMAIL_ALREADY_EXISTS);
      }
    }

    if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
      const existingUser = await this.userRepository.findOne({
        where: { userName: updateUserDto.userName },
      });

      if (existingUser) {
        throw new CustomException(USERNAME_ALREADY_EXISTS);
      }
    }

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Gets the user profile.
   *
   * @param user The user to get the profile.
   * @returns The user profile.
   * @throws {CustomException} If the user is not found.
   */
  async getProfile(user: User) {
    if (!user) {
      throw new CustomException(USER_NOT_FOUND);
    }
    if (user.profilePhoto) {
      user.profilePhoto = (await this.fileService.getImageUrl(
        user.profilePhoto,
      )) as string;
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Generates and returns a new set of access and refresh tokens for a user.
   *
   * @param userId - The ID of the user for whom to generate tokens.
   * @returns An object containing the access token and refresh token.
   */
  async generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    await this.storeRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generates an access token for a user.
   *
   * @param userId - The ID of the user for whom to generate the token.
   * @returns The access token.
   *
   * The token is a JSON Web Token (JWT) signed with the JWT secret from the configuration.
   * The token will expire after the amount of time specified in the JWT_EXPIRATION configuration variable.
   * If JWT_EXPIRATION is not set, the token will expire after 1 hour.
   */
  private generateAccessToken(userId: string): string {
    const accessTokenExpiry =
      this.configService.get<string>('JWT_EXPIRATION') || '1h'; // 1 hour

    const payload: JwtPayload = { sub: userId };

    return this.jwtService.sign(payload, { expiresIn: accessTokenExpiry });
  }

  /**
   * Generates a refresh token for a user.
   *
   * @param userId - The ID of the user for whom to generate the refresh token.
   * @returns The refresh token as a string.
   *
   * The token is a JSON Web Token (JWT) that includes a payload identifying it
   * as a refresh token. It is signed with the JWT secret from the configuration
   * and will expire after the time specified in the JWT_REFRESH_EXPIRATION
   * configuration variable. If not set, it defaults to 7 days.
   */
  private generateRefreshToken(userId: string): string {
    const refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d'; // 7 days

    const payload: JwtPayload = {
      sub: userId,
      isRefreshToken: true, // To identify it as a refresh token
    };

    return this.jwtService.sign(payload, { expiresIn: refreshTokenExpiry });
  }

  /**
   * Stores a refresh token for a user in the database.
   *
   * The token is stored in the RefreshToken collection in the database,
   * with the user ID and an expiration date that is the current time plus
   * the amount of time specified in the JWT_REFRESH_EXPIRATION configuration
   * variable. If not set, it defaults to 7 days.
   *
   * @param userId - The ID of the user for whom to store the refresh token.
   * @param token - The refresh token to store.
   *
   * @returns A promise that resolves when the token has been stored.
   *
   * The promise is rejected if the token cannot be stored.
   */
  private async storeRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d'; // 7 days
    const expiresAt = await parseExpirationDate(refreshTokenExpiry);
    await this.tokenRepository.upsert({ userId, token, expiresAt: expiresAt }, [
      'userId',
    ]);
    this.logger.log(`Refresh token stored for user ${userId}`);
  }

  /**
   * Generates a new access token for a user, given a valid refresh token.
   *
   * @param refreshToken - The refresh token to use to generate a new access token.
   *
   * @returns A promise that resolves with an object containing a single property,
   *          `accessToken`, which is the new access token. The promise is rejected
   *          if the refresh token is invalid.
   *
   * If the refresh token is valid, this method will verify it and use the user ID
   * from the payload to generate a new access token. The new access token will
   * be returned in the response.
   *
   * If the refresh token is invalid, a {CustomException} will be thrown with a
   * message indicating that the refresh token is invalid.
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (!payload.isRefreshToken) {
        throw new CustomException('Invalid refresh token');
      }

      const storedToken = await this.tokenRepository.findOne({
        where: { userId: payload.sub, token: refreshToken },
      });

      if (!storedToken) throw new CustomException('Refresh token not found');

      const newAccessToken = this.generateAccessToken(payload.sub);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new CustomException('Invalid refresh token');
    }
  }
}
