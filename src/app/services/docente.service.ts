// docente.service.ts
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DocenteService {
  constructor(private db: AngularFireDatabase) {}

  getDocente(): Observable<any[]> {
    return this.db.list('docente').valueChanges();
  }
}
