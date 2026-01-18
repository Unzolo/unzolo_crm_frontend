import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

interface AuthState {
  // Login/Global email
  email: string;
  setEmail: (email: string) => void;
  
  // Signup specific data for pre-filling
  signupData: SignupData;
  setSignupData: (data: Partial<SignupData>) => void;
  
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: '',
      setEmail: (email: string) => set({ email }),
      
      signupData: {
        name: '',
        email: '',
        phone: '',
        password: '',
      },
      setSignupData: (data) => 
        set((state) => ({ 
          signupData: { ...state.signupData, ...data } 
        })),

      clearAuth: () => set({ 
        email: '', 
        signupData: { name: '', email: '', phone: '', password: '' } 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
