/**
 * Basic test suite for Dashboard Admin Service
 * Tests service layer functions
 */

import { ADMIN_CONFIG } from '../../constants/config';

describe('Admin Service', () => {
  describe('Configuration', () => {
    it('should have admin configuration defined', () => {
      expect(ADMIN_CONFIG).toBeDefined();
      expect(ADMIN_CONFIG.ADMIN_EMAIL).toBeDefined();
      expect(ADMIN_CONFIG.ADMIN_PASSWORD).toBeDefined();
    });

    it('should have session timeout configured', () => {
      expect(ADMIN_CONFIG.SESSION_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it('should have colors configured', () => {
      expect(ADMIN_CONFIG.COLORS).toBeDefined();
      expect(ADMIN_CONFIG.COLORS.primary).toBeDefined();
      expect(ADMIN_CONFIG.COLORS.danger).toBeDefined();
      expect(ADMIN_CONFIG.COLORS.success).toBeDefined();
    });
  });

  describe('Service Functions', () => {
    it('should have required service functions available', () => {
      const adminService = require('../../services/adminService');
      
      expect(typeof adminService.verifyAdminCredentials).toBe('function');
      expect(typeof adminService.fetchAllUsers).toBe('function');
      expect(typeof adminService.deleteUser).toBe('function');
      expect(typeof adminService.fetchDashboardStats).toBe('function');
    });
  });
});
