import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IngresoService {
  constructor(private db: AngularFireDatabase) {}

  getIngreso(): Observable<any[]> {
    return this.db.list('Ingreso').valueChanges();
  }
}