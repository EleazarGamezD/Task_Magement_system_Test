import { User } from '@modules/shared/database/shared/schemas/user.schema';
import { OmitType } from '@nestjs/swagger';

export class UserWithoutPassword extends OmitType(User, [
  'password',
] as const) {}
