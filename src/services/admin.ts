
import { userService } from './admin/userService';
import { auditService } from './admin/auditService';
import { statsService } from './admin/statsService';

export const adminService = {
  // Déléguer aux services spécialisés
  ...userService,
  ...auditService,
  ...statsService
};
