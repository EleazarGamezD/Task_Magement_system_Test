import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../schemas/refreshToken.schema';

@Injectable()
export class TokenRepository extends Repository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    refreshTokenRepository: Repository<RefreshToken>,
  ) {
    super(
      refreshTokenRepository.target,
      refreshTokenRepository.manager,
      refreshTokenRepository.queryRunner,
    );
  }
}
