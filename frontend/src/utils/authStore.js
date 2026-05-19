import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('vault_token') || null,
  user: JSON.parse(localStorage.getItem('vault_user') || 'null'),

  login: (token, user) => {
    localStorage.setItem('vault_token', token);
    localStorage.setItem('vault_user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
