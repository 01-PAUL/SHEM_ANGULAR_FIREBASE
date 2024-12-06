import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { AppMaterialModule } from '../app.material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Docente } from '../model/docente.model';

@Component({
  selector: 'app-docente',
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
  templateUrl: './actualizar-docente.component.html',
  styleUrl: './actualizar-docente.component.css'
})
export class ActualizarDocenteComponent {

  docentes: { key: string; data: Docente }[] = [];
  docentesFiltrados: { key: string; data: Docente }[] = [];
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
      .get<{ [key: string]: Docente }>(
        'https://shem-firebase-default-rtdb.firebaseio.com/docente.json'
      )
      .subscribe((data) => {
        if (data) {
          this.docentes = Object.entries(data)
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
          this.docentesFiltrados = [...this.docentes]; // Mostrar todos inicialmente
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
        this.docentesFiltrados = [...this.docentes]; // Restablece la lista de estudiantes
      }
    }, 0); 
  }

  buscarDocentes(): void {
    const filtro = this.filtroTexto.trim().toLowerCase();  // Elimina los espacios en blanco al inicio y final
    if (filtro) {
      this.docentesFiltrados = this.docentes.filter((docente) =>
        docente.data.nombres.toLowerCase().includes(filtro) ||
        docente.data.codUsuario.toLowerCase().includes(filtro)
      );
    } else {
      this.docentesFiltrados = [...this.docentes];  // Si no hay filtro, mostrar todos los estudiantes
    }
  }

  toggleAutorizacion(docente: { key: string; data: Docente }): void {
    docente.data.autorizacion =
    docente.data.autorizacion === 'Autorizado' ? 'No Autorizado' : 'Autorizado';
    this.http
      .put(
        `https://shem-firebase-default-rtdb.firebaseio.com/docente/${docente.key}.json`,
        docente.data
      )
      .subscribe(
        () => {
          console.log('Autorización actualizada correctamente.');
          docente.data = { ...docente.data }; // Crear una copia para forzar el cambio
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

eliminarDocente(docentes: { key: string; data: Docente }): void {
  this.http
    .delete(
      `https://shem-firebase-default-rtdb.firebaseio.com/docente/${docentes.key}.json`
    )
    .subscribe(
      () => {
        // Eliminar el elemento de las listas
        this.docentes = this.docentes.filter(item => item.key !== docentes.key);
        this.docentesFiltrados = this.docentesFiltrados.filter(item => item.key !== docentes.key);

        // Ajustar la paginación en caso de que se elimine un elemento en la última página
        if (this.paginaActual * this.elementosPorPagina >= this.docentesFiltrados.length) {
          this.paginaActual = Math.max(0, this.paginaActual - 1);
        }

        // Mostrar el mensaje de eliminación
        this.nombreEliminado = docentes.data.nombres;
        this.codigoEliminado = docentes.data.codUsuario;
        this.mensajeVisibl = true;
        
        setTimeout(() => {
          this.mensajeVisibl = false;
          this.cdRef.detectChanges(); // Actualizar la vista después de ocultar el mensaje
        }, 3000);

        // Forzar la detección de cambios
        this.cdRef.detectChanges();
      },
      (error) => {
        console.error('Error al eliminar el Docente', error);
      }
    );
}


}
