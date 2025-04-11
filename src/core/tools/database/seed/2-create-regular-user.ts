import { PermissionsEnum } from '@enums/permissions.enums';
import { ValidRoles } from '@enums/valid-roles';
import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegularUser1681114002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if user already exists
    const existingUser = await queryRunner.query(`
      SELECT * FROM "user" WHERE "email" = 'user@example.com'
    `);

    if (existingUser && existingUser.length > 0) {
      console.log('Regular user already exists, skipping creation');
      return;
    }

    // Create regular user with proper password hashing
    const userPassword = bcrypt.hashSync('Password123', 10);

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
        '22222222-2222-2222-2222-222222222222', 
        'user@example.com', 
        true, 
        '${userPassword}', 
        'Regular', 
        'User', 
        'regularuser', 
        null, 
        '{${ValidRoles.USER}}', 
        '{${PermissionsEnum.CREATE_OWN_TASK},${PermissionsEnum.READ_OWN_TASK},${PermissionsEnum.UPDATE_OWN_TASK},${PermissionsEnum.DELETE_OWN_TASK},${PermissionsEnum.READ_ALL_OWN_TASK}}'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user" 
      WHERE "id" = '22222222-2222-2222-2222-222222222222'
    `);
  }
}
