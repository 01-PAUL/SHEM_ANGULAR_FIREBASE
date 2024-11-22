import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { Auth, createUserWithEmailAndPassword, updatePhoneNumber, updateProfile, user } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { UserInterface } from './user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth)
  currentUserSig = signal<UserInterface | null | undefined>(undefined)

  register(
    email: string,
    username: string,
    password:string,
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then(response => updateProfile(response.user, {displayName: username}))

    return from(promise);
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then(() => {});

    return from(promise);
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth);
    return from(promise);
  }

  getErrorMessage(code: string): string {
    return ERROR_MESSAGES[code] || 'Ha ocurrido un error desconocido.';
  }
  
}

const ERROR_MESSAGES: { [key: string]: string } = {
  'auth/user-not-found': 'No se encontró una cuenta con ese correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/user-disabled': 'La cuenta ha sido deshabilitada.',
  'auth/email-already-in-use': 'El correo ya está en uso por otra cuenta.',
  'auth/weak-password': 'La contraseña es demasiado débil.',
  'auth/invalid-credential': 'Email y/o contraseña incorrectos',
};
