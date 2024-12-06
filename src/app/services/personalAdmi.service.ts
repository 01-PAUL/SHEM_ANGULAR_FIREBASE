// personalAdmin.service.ts
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PersonalAdminService {
  constructor(private db: AngularFireDatabase) {}

  getPersonalAdmin(): Observable<any[]> {
    return this.db.list('personalAdministrativo').valueChanges();
  }
}
