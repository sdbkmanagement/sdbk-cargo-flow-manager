
import { userService } from './admin/userService';
import { rolePermissionService } from './admin/rolePermissionService';
import { auditService } from './admin/auditService';
import { statsService } from './admin/statsService';

export const adminService = {
  // Déléguer aux services spécialisés
  ...userService,
  ...rolePermissionService,
  ...auditService,
  ...statsService
};
