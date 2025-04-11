import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionsEnum } from '../../../enums/permissions.enums';
import { ValidRoles } from '../../../enums/valid-roles';

export class CreateAdminUser1681114001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admin user with proper password hashing
    const adminPassword = bcrypt.hashSync('Admin123', 10);

    await queryRunner.query(`
      INSERT INTO "user" (
        "id", 
        "email", 
        "isActive", 
        "password", 
        "firstName", 
        "lastName", 
        "userName", 
        "profilePhoto", 
        "roles", 
        "permissions"
      ) VALUES (
        '11111111-1111-1111-1111-111111111111', 
        'admin@example.com', 
        true, 
        '${adminPassword}', 
        'Admin', 
        'User', 
        'adminuser', 
        null, 
        '{${ValidRoles.ADMIN}}', 
        '{${PermissionsEnum.READ_ALL_TASK},${PermissionsEnum.UPDATE_ALL_TASK},${PermissionsEnum.DELETE_ALL_TASK}}'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete admin user
    await queryRunner.query(`
      DELETE FROM "user" 
      WHERE "id" = '11111111-1111-1111-1111-111111111111'
    `);
  }
}
