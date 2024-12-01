import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const firebaseConfig = {
  apiKey: "AIzaSyASulamP5sB0pl9SLDxbzMWFWyJF8M51wg",
  authDomain: "shem-firebase.firebaseapp.com",
  databaseURL: "https://shem-firebase-default-rtdb.firebaseio.com",
  projectId: "shem-firebase",
  storageBucket: "shem-firebase.firebasestorage.app",
  messagingSenderId: "558708996187",
  appId: "1:558708996187:web:00ec8f99c6ebea20b0277e",
  measurementId: "G-GTR8DB1CLG"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()), provideAnimationsAsync(), provideAnimationsAsync(), provideAnimationsAsync()
  ],
};
