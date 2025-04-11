import { PermissionsEnum } from '@enums/permissions.enums';
import { ValidRoles } from '@enums/valid-roles';

const permissions = {
  CREATE_OWN_TASK: {
    name: PermissionsEnum.CREATE_OWN_TASK,
    description: 'Create a new TASK',
  },
  READ_ALL_OWN_TASK: {
    name: PermissionsEnum.READ_ALL_OWN_TASK,
    description: 'Read OWN TASK information',
  },
  READ_OWN_TASK: {
    name: PermissionsEnum.READ_OWN_TASK,
    description: 'Read TASK information',
  },
  UPDATE_OWN_TASK: {
    name: PermissionsEnum.UPDATE_OWN_TASK,
    description: 'Update TASK information',
  },
  DELETE_OWN_TASK: {
    name: PermissionsEnum.DELETE_OWN_TASK,
    description: 'Delete a TASK',
  },
  READ_ALL_TASK: {
    name: PermissionsEnum.READ_ALL_TASK,
    description: 'Read all TASK information',
  },
  UPDATE_ALL_TASK: {
    name: PermissionsEnum.UPDATE_ALL_TASK,
    description: 'Update all TASK information',
  },
  DELETE_ALL_TASK: {
    name: PermissionsEnum.DELETE_ALL_TASK,
    description: 'Delete all TASK information',
  },
};

export const rolesPermissions = {
  [ValidRoles.ADMIN]: [
    permissions.READ_ALL_TASK,
    permissions.UPDATE_ALL_TASK,
    permissions.DELETE_ALL_TASK,
  ],
  [ValidRoles.USER]: [
    permissions.READ_ALL_OWN_TASK,
    permissions.CREATE_OWN_TASK,
    permissions.READ_OWN_TASK,
    permissions.UPDATE_OWN_TASK,
    permissions.DELETE_OWN_TASK,
  ],
};
