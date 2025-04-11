import { ValidRoles } from '@enums/valid-roles';
import { SetMetadata } from '@nestjs/common';

export const META_ROLES = 'roles';

/**
 * A decorator that assigns specified roles to a route handler.
 *
 * @param {...ValidRoles[]} args - The roles to assign to the route handler.
 * @returns {CustomDecorator<string>} A metadata decorator.
 */
export const Roles = (...roles: ValidRoles[]) => SetMetadata(META_ROLES, roles);
