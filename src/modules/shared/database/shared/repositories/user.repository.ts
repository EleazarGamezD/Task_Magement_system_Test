import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    @InjectRepository(User)
    userRepository: Repository<User>,
  ) {
    super(
      userRepository.target,
      userRepository.manager,
      userRepository.queryRunner,
    );
  }

  /**
   * Finds a user by id
   *
   * @param id - User id
   *
   * @returns Found user or null
   */
  async findOneById(id: string): Promise<User | null> {
    return await this.findOne({ where: { id } });
  }

  public findUser(email?: string, userName?: string, id?: string) {
    const query = this.createQueryBuilder('user').select();

    if (email) {
      query.andWhere('LOWER(user.email) LIKE :email', {
        email: `%${email.toLowerCase()}%`,
      });
    }

    if (userName) {
      query.andWhere('LOWER(user.userName) LIKE :userName', {
        userName: `%${userName.toLowerCase()}%`,
      });
    }

    if (id) {
      query.andWhere('user.id = :id', { id });
    }

    return query.getOne();
  }
}
