import { create } from 'zustand';
import { adminService } from '../services/adminService';

// The JWT lives in an httpOnly cookie (invisible to JS). We only keep the admin profile in memory.
export const useAdminAuth = create((set) => ({
  admin: null,
  status: 'idle', // idle | loading | ready

  async bootstrap() {
    set({ status: 'loading' });
    try {
      const { admin } = await adminService.me();
      set({ admin, status: 'ready' });
    } catch {
      set({ admin: null, status: 'ready' });
    }
  },

  async login(credentials) {
    const { admin } = await adminService.login(credentials);
    set({ admin, status: 'ready' });
    return admin;
  },

  async logout() {
    try { await adminService.logout(); } catch { /* cookie may already be gone */ }
    set({ admin: null });
  },

  clear: () => set({ admin: null }),
}));
