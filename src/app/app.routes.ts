import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LogicComponent } from './login/login.component';
import { PrincipalComponent } from './principal/principal.component';
import { EstudianteComponent } from './estudiante/estudiante.component';
import { PersonalAdminComponent } from './personal-admin/personal-admin.component';
import { DocenteComponent } from './docente/docente.component';
import { ActualizarEstudianteComponent } from './actualizar-estudiante/actualizar-estudiante.component';
import { ActualizarDocenteComponent } from './actualizar-docente/actualizar-docente.component';
import { ActualizarPersonalAdminComponent } from './actualizar-personal-admin/actualizar-personal-admin.component';
import { ReporteEstudianteComponent } from './reporte-estudiante/reporte-estudiante.component';
import { ReporteDocenteComponent } from './reporte-docente/reporte-docente.component';
import { ReportePersonalAdminComponent } from './reporte-personal-admin/reporte-personal-admin.component';
import { UsuarioComponent } from './usuario/usuario.component';

export const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent,
  },
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
    path: 'estudiante',
    component: EstudianteComponent,
  },
  {
    path: 'usuario',
    component: UsuarioComponent,
  },
  {
    path: 'docente',
    component: DocenteComponent,
  },
  {
    path: 'personal',
    component: PersonalAdminComponent,
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
      //reportes
      {
        path: 'estudianteRep',
        component: ReporteEstudianteComponent,
      },
      {
        path: 'docenteRep',
        component: ReporteDocenteComponent,
      },
      {
        path: 'personalRep',
        component: ReportePersonalAdminComponent,
      },



];
