import { Routes } from '@angular/router';
import { LogicComponent } from './login/login.component';
import { PrincipalComponent } from './principal/principal.component';

import { UsuarioComponent } from './usuario/usuario.component';
import { ActualizarEstudianteComponent } from './actualizar-estudiante/actualizar-estudiante.component';
import { ActualizarDocenteComponent } from './actualizar-docente/actualizar-docente.component';
import { ActualizarPersonalAdminComponent } from './actualizar-personal-admin/actualizar-personal-admin.component';


export const routes: Routes = [
  {
    path: 'principal',
    component: PrincipalComponent,
  },
  {
    path: '',
    component: LogicComponent,
  },
  //registros

  {
    path: 'usuario',
    component: UsuarioComponent,
  },
  
    //actualizar
    {
      path: 'estudianteAct',
      component: ActualizarEstudianteComponent,
    },
    {
      path: 'docenteAct',
      component: ActualizarDocenteComponent,
    },
    {
      path: 'personalAct',
      component: ActualizarPersonalAdminComponent,
    },
      
];
