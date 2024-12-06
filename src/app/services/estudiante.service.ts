// estudiante.service.ts
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EstudianteService {
  constructor(private db: AngularFireDatabase) {}

  getEstudiantes(): Observable<any[]> {
    return this.db.list('estudiante').valueChanges();
  }
}