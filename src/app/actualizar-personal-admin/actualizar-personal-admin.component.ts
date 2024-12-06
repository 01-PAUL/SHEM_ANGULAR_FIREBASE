import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { AppMaterialModule } from '../app.material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PersonalAdmin } from '../model/personalAdmi.model';

@Component({
  selector: 'app-personal-admin',
  standalone: true,
  imports: [
    AppMaterialModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './actualizar-personal-admin.component.html',
  styleUrl: './actualizar-personal-admin.component.css'
})
export class ActualizarPersonalAdminComponent {
  personalAdmin: { key: string; data: PersonalAdmin }[] = [];
  personalAdminFiltrados: { key: string; data: PersonalAdmin }[] = [];
  filtroTexto: string = '';
  paginaActual: number = 0;
  elementosPorPagina: number = 4;
  mensajeVisible: boolean = false;
  mensajeVisibl: boolean = false;
  codigoActualizado: string = '';
  cicloActualizado: string = '';
  nombreEliminado: string = '';
  codigoEliminado: string = '';

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http
      .get<{ [key: string]: PersonalAdmin }>(
        'https://shem-firebase-default-rtdb.firebaseio.com/personalAdministrativo.json'
      )
      .subscribe((data) => {
        if (data) {
          this.personalAdmin = Object.entries(data)
            .filter(([key, item]) => item !== null)
            .map(([key, item]) => ({
              key,
              data: {
                ...item,
                idTipoDocumento: Number(item.idTipoDocumento),
                idTipoUsuario: Number(item.idTipoUsuario),
                autorizacion: item.autorizacion === 'Autorizado' ? 'Autorizado' : 'No Autorizado',
              },
            }));
          this.personalAdminFiltrados = [...this.personalAdmin]; // Mostrar todos inicialmente
        }
      });
  }

  cambiarPagina(event: any): void {
    this.paginaActual = event.pageIndex; // Actualiza la página actual
  }

  prevenirEntradaNoAlfanumerica(event: KeyboardEvent): void {
    const regex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ0-9]*$/; // Solo permite letras, números y ñ/Ñ
    const noPermitidos = ['´', '´'];  // Caracteres explícitos no permitidos
  
    // Verifica si el carácter no es válido según la expresión regular o está en los no permitidos
    if (!regex.test(event.key) || noPermitidos.includes(event.key)) {
      event.preventDefault(); // Bloquea la entrada
    }
  }  

  validarPegado(event: ClipboardEvent): void {
    const clipboardText = event.clipboardData?.getData('text') ?? '';
  
    // Regex to match only alphanumeric characters, ñ, and Ñ
    const sanitizedText = clipboardText.replace(/[^a-zA-Z0-9ñÑ]/g, '');
  
    // If the sanitized text is different, replace the clipboard content with the cleaned text
    if (clipboardText !== sanitizedText) {
      event.preventDefault();
      document.execCommand('insertText', false, sanitizedText);
    }
  }
  

  validarEmoji(): void {
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2000-\u206F\u25AA\uFE0F]/;
    
    // Usamos setTimeout para que Angular haya procesado el cambio del modelo antes de realizar la validación
    setTimeout(() => {
      if (emojiRegex.test(this.filtroTexto)) {
        this.filtroTexto = ''; // Borra el texto si contiene un emoji
        this.personalAdminFiltrados = [...this.personalAdmin]; // Restablece la lista de estudiantes
      }
    }, 0); 
  }

  buscarDocentes(): void {
    const filtro = this.filtroTexto.trim().toLowerCase();  // Elimina los espacios en blanco al inicio y final
    if (filtro) {
      this.personalAdminFiltrados = this.personalAdmin.filter((personalAdmin) =>
        personalAdmin.data.nombres.toLowerCase().includes(filtro) ||
      personalAdmin.data.codUsuario.toLowerCase().includes(filtro)
      );
    } else {
      this.personalAdminFiltrados = [...this.personalAdmin];  // Si no hay filtro, mostrar todos los estudiantes
    }
  }

  toggleAutorizacion(personalAdmin: { key: string; data: PersonalAdmin }): void {
    personalAdmin.data.autorizacion =
    personalAdmin.data.autorizacion === 'Autorizado' ? 'No Autorizado' : 'Autorizado';
    this.http
      .put(
        `https://shem-firebase-default-rtdb.firebaseio.com/personalAdministrativo/${personalAdmin.key}.json`,
        personalAdmin.data
      )
      .subscribe(
        () => {
          console.log('Autorización actualizada correctamente.');
          personalAdmin.data = { ...personalAdmin.data }; 
        },
        (error) => {
          console.error('Error al actualizar la autorización:', error);
        }
      );
  }
  
  getTipoDocumento(idTipoDocumento: number): string {
  switch (idTipoDocumento) {
    case 1:
      return 'DNI';
    case 2:
      return 'Carnet Ext.';
    default:
      return 'Desconocido';
  }
}

getTipoUsuario(idTipoUsuario: number): string {
  switch (idTipoUsuario) {
    case 1:
      return 'Estudiante';
    default:
      return 'Desconocido';
  }
}

eliminarPersonalAdmin(personalAdmin: { key: string; data: PersonalAdmin }): void {
  this.http
    .delete(
      `https://shem-firebase-default-rtdb.firebaseio.com/personalAdministrativo/${personalAdmin.key}.json`
    )
    .subscribe(
      () => {
        // Eliminar el elemento de las listas
        this.personalAdmin = this.personalAdmin.filter(item => item.key !== personalAdmin.key);
        this.personalAdminFiltrados = this.personalAdminFiltrados.filter(item => item.key !== personalAdmin.key);

        // Ajustar la paginación en caso de que se elimine un elemento en la última página
        if (this.paginaActual * this.elementosPorPagina >= this.personalAdminFiltrados.length) {
          this.paginaActual = Math.max(0, this.paginaActual - 1);
        }

        // Mostrar el mensaje de eliminación
        this.nombreEliminado = personalAdmin.data.nombres;
        this.codigoEliminado = personalAdmin.data.codUsuario;
        this.mensajeVisibl = true;
        
        setTimeout(() => {
          this.mensajeVisibl = false;
          this.cdRef.detectChanges(); // Actualizar la vista después de ocultar el mensaje
        }, 3000);

        // Forzar la detección de cambios
        this.cdRef.detectChanges();
      },
      (error) => {
        console.error('Error al eliminar el personal administrativo:', error);
      }
    );
}


}
