import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();

  constructor() {
    // Simular usuario inicial
    this.currentUserSignal.set({
      id: '1',
      name: 'Administrador',
      email: 'admin@365soft.com',
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Administrador&background=0D8ABC&color=fff'
    });
  }

  login(email: string, password: string): boolean {
    // TODO: Implementar autenticación real
    return true;
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSignal();
    return user ? roles.includes(user.role) : false;
  }
}
