// JSON dosyası tabanlı veritabanı
// Gerçek projede PostgreSQL, MongoDB, Prisma vb. kullanılmalı

import { promises as fs } from "fs";
import path from "path";

export interface User {
  id: string;
  email: string;
  password: string; // Gerçek projede hash'lenmiş olmalı
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
  createdAt: string;
}

// Veritabanı dosyası yolu
// Railway'de /tmp kullan (geçici dosya sistemi için)
const DB_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "data")
  : process.env.NODE_ENV === 'production' 
    ? path.join("/tmp", "data") // Railway production için /tmp kullan
    : path.join(process.cwd(), "data"); // Local development için

const DB_FILE_PATH = path.join(DB_DIR, "users.json");

// Veritabanı dosyasını oluştur (yoksa)
async function ensureDbFile() {
  const dbDir = path.dirname(DB_FILE_PATH);
  try {
    await fs.mkdir(dbDir, { recursive: true });
  } catch {
    // Klasör zaten varsa hata vermez
  }

  try {
    await fs.access(DB_FILE_PATH);
  } catch {
    // Dosya yoksa oluştur
    const initialData: User[] = [
      {
        id: "1",
        email: "test@example.com",
        password: "123456", // Gerçek projede bcrypt ile hash'lenmeli
        name: "Test User",
        createdAt: new Date().toISOString(),
      },
    ];
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

// Kullanıcıları dosyadan oku
async function loadUsers(): Promise<User[]> {
  await ensureDbFile();
  try {
    const data = await fs.readFile(DB_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
}

// Kullanıcıları dosyaya kaydet
async function saveUsers(users: User[]): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DB_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await loadUsers();
  return users.find((u) => u.email === email);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await loadUsers();
  return users.find((u) => u.id === id);
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
  const users = await loadUsers();
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const users = await loadUsers();
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  await saveUsers(users);
  return users[userIndex];
}

export async function getAllUsers(): Promise<User[]> {
  return await loadUsers();
}

