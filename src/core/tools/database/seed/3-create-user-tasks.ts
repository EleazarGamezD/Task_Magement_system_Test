import { PermissionsEnum } from '@enums/permissions.enums';
import { TaskStatus } from '@enums/task.enum';
import { ValidRoles } from '@enums/valid-roles';
import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTasks1681114003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the regular user exists
    const user = await queryRunner.query(`
      SELECT * FROM "user" WHERE "id" = '22222222-2222-2222-2222-222222222222'
    `);

    if (!user || user.length === 0) {
      console.log(
        'Regular user does not exist, creating user before adding tasks',
      );

      // Create the regular user
      const userPassword = bcrypt.hashSync('User123', 10);

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
          'regularuser@example.com', 
          true, 
          '${userPassword}', 
          'Regular', 
          'User', 
          'regularuser', 
          null, 
          '{${ValidRoles.USER}}', 
          '{${PermissionsEnum.CREATE_OWN_TASK},${PermissionsEnum.READ_OWN_TASK},${PermissionsEnum.UPDATE_OWN_TASK},${PermissionsEnum.DELETE_OWN_TASK}}'
        )
      `);

      console.log('Successfully created regular user');
    }

    // Now create the tasks
    console.log('Creating tasks for the regular user');

    // Task 1: To-do task
    await queryRunner.query(`
      INSERT INTO "task" (
        "id",
        "title",
        "description",
        "status",
        "dueDate",
        "userId"
      ) VALUES (
        '11111111-1111-1111-1111-111111111111', 
        'Complete project documentation',
        'Write detailed documentation for the task management system including API endpoints and data structures',
        '${TaskStatus.TODO}',
        '${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}',
        '22222222-2222-2222-2222-222222222222'
      )
    `);

    // Task 2: In-progress task
    await queryRunner.query(`
      INSERT INTO "task" (
        "id",
        "title",
        "description",
        "status",
        "dueDate",
        "userId"
      ) VALUES (
        '22222222-1111-1111-1111-111111111111',
        'Implement user authentication',
        'Add JWT token-based authentication with refresh tokens and proper password hashing',
        '${TaskStatus.IN_PROGRESS}',
        '${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}',
        '22222222-2222-2222-2222-222222222222'
      )
    `);

    // Task 3: Completed task
    await queryRunner.query(`
      INSERT INTO "task" (
        "id",
        "title",
        "description",
        "status",
        "dueDate",
        "userId"
      ) VALUES (
        '33333333-1111-1111-1111-111111111111',
        'Set up project structure',
        'Initialize the NestJS project and set up the basic folder structure for modules, services, and controllers',
        '${TaskStatus.DONE}',
        '${new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()}',
        '22222222-2222-2222-2222-222222222222'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all tasks created for the regular user
    await queryRunner.query(`
      DELETE FROM "task" 
      WHERE "id" IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-1111-1111-1111-111111111111',
        '33333333-1111-1111-1111-111111111111'
      )
    `);
  }
}
