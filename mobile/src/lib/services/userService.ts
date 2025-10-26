import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  address: string;
  ensName?: string;
  avatar?: string;
  addedAt: number;
}

const USERS_STORAGE_KEY = 'saved_users';

class UserService {
  private users: User[] = [];

  async loadUsers(): Promise<User[]> {
    try {
      const stored = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        this.users = JSON.parse(stored);
      }
      return this.users;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async saveUsers(): Promise<void> {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  async addUser(user: Omit<User, 'id' | 'addedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      addedAt: Date.now(),
    };

    // Check if user already exists
    const existingUser = this.users.find(u => u.address.toLowerCase() === user.address.toLowerCase());
    if (existingUser) {
      throw new Error('User with this address already exists');
    }

    this.users.push(newUser);
    await this.saveUsers();
    return newUser;
  }

  async removeUser(userId: string): Promise<void> {
    this.users = this.users.filter(user => user.id !== userId);
    await this.saveUsers();
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    await this.saveUsers();
    return this.users[userIndex];
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserByAddress(address: string): User | null {
    return this.users.find(user => user.address.toLowerCase() === address.toLowerCase()) || null;
  }

  getUserById(id: string): User | null {
    return this.users.find(user => user.id === id) || null;
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getDisplayName(address: string): string {
    const user = this.getUserByAddress(address);
    if (user) {
      return user.ensName || user.name;
    }
    return this.formatAddress(address);
  }
}

export const userService = new UserService();
