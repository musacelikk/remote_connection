"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id?: string;
  email: string;
  name?: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  companyName?: string;
  taxNumber?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  firstName?: string;
  lastName?: string;
  gsm?: string;
  tcNumber?: string;
  username?: string;
  enable2FA?: boolean;
  phoneFor2FA?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgisini kontrol et
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Giriş başarısız");
      }

      // Token ve kullanıcı bilgisini kaydet
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Beklenmeyen giriş hatası");
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Kayıt başarısız");
      }

      // Token ve kullanıcı bilgisini kaydet
      if (responseData.token) {
        localStorage.setItem("token", responseData.token);
      }
      if (responseData.user) {
        setUser(responseData.user);
        localStorage.setItem("user", JSON.stringify(responseData.user));
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Beklenmeyen kayıt hatası");
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Şifre değiştirme başarısız");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Beklenmeyen şifre değiştirme hatası");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        changePassword,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

