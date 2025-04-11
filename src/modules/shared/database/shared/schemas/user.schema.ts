import { rolesPermissions } from '@core/constants/permissions/perimissions.contants';
import { PermissionsEnum } from '@enums/permissions.enums';
import { ValidRoles } from '@enums/valid-roles';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskNotification } from './notification.schema';
import { Task } from './task.schema';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @Column({
    type: 'boolean',
    default: 'true',
  })
  @IsNotEmpty()
  @ApiProperty({
    description: 'User is active',
    example: 'true',
  })
  isActive: boolean;

  @Column({
    type: 'varchar',
    length: 255,
  })
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  userName: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @IsString()
  @ApiProperty({
    description: 'user profile photo',
    example: 'profile.jpg',
    required: false,
  })
  profilePhoto: string;

  @Column({
    type: 'enum',
    enum: ValidRoles,
    array: true,
    default: [ValidRoles.USER],
  })
  @IsEnum(ValidRoles, { each: true })
  @ApiProperty({
    description: 'User roles',
    enum: ValidRoles,
    isArray: true,
    example: [ValidRoles.USER],
  })
  roles: ValidRoles[];

  @ApiProperty({
    example: [PermissionsEnum.READ_OWN_TASK, PermissionsEnum.CREATE_OWN_TASK],
    description: 'Permissions of the user based on their roles',
    required: false,
  })
  @Column({
    type: 'enum',
    enum: PermissionsEnum,
    array: true,
    default: [],
    nullable: true,
  })
  permissions: PermissionsEnum[];

  // Relationships
  @OneToMany(() => Task, (task) => task.user, { cascade: true })
  tasks: Task[];

  @OneToMany(() => TaskNotification, (notification) => notification.destination)
  notifications: TaskNotification[];

  // Hooks for data transformation
  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  /**
   * Assigns default permissions to the user based on their roles.
   */
  @BeforeInsert()
  async assignDefaultPermissions() {
    if (!this.permissions || this.permissions.length === 0) {
      // Default to USER role if none provided
      if (!this.roles || this.roles.length === 0) {
        this.roles = [ValidRoles.USER];
      }

      // Collect permissions from all roles
      const allPermissions: PermissionsEnum[] = [];

      for (const role of this.roles) {
        const rolePermissions = rolesPermissions[role];
        if (rolePermissions && rolePermissions.length > 0) {
          const permissions = rolePermissions.map(
            (permission) => permission.name,
          );
          allPermissions.push(...permissions);
        }
      }

      // Remove duplicates
      this.permissions = [...new Set(allPermissions)];
    }
  }

  /**
   * Updates the user's permissions when their roles change.
   * Only includes permissions from current roles.
   */
  @BeforeUpdate()
  async updatePermissionsOnRoleChange() {
    // If no roles, default to empty permissions
    if (!this.roles || this.roles.length === 0) {
      this.permissions = [];
      return;
    }

    // Collect all permissions from current roles
    const allPermissions: PermissionsEnum[] = [];

    for (const role of this.roles) {
      const rolePermissions = rolesPermissions[role];
      if (rolePermissions && rolePermissions.length > 0) {
        const permissions = rolePermissions.map(
          (permission) => permission.name,
        );
        allPermissions.push(...permissions);
      }
    }

    // Remove duplicates and assign
    this.permissions = [...new Set(allPermissions)];
  }
}
