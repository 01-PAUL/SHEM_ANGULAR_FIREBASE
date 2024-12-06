import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AppMaterialModule } from '../app.material.module';
import { Estudiante } from '../model/estudiante.model';

@Component({
  selector: 'app-estudiante',
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
  templateUrl: './actualizar-estudiante.component.html',
  styleUrls: ['./actualizar-estudiante.component.css'],
})
export class ActualizarEstudianteComponent implements OnInit {
  estudiantes: { key: string; data: Estudiante }[] = [];
  estudiantesFiltrados: { key: string; data: Estudiante }[] = [];
  filtroTexto: string = '';
  paginaActual: number = 0;
  elementosPorPagina: number = 4;
  mensajeVisible: boolean = false;
  mensajeVisibl: boolean = false;
  codigoActualizado: string = '';
  cicloActualizado: string = '';

  nombreEliminado: string = '';
  codigoEliminado: string = '';
  maxPalabras: number = 25;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http
      .get<{ [key: string]: Estudiante }>(
        'https://shem-firebase-default-rtdb.firebaseio.com/estudiante.json'
      )
      .subscribe((data) => {
        if (data) {
          this.estudiantes = Object.entries(data)
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
          this.estudiantesFiltrados = [...this.estudiantes]; // Mostrar todos inicialmente
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

  validarPalabras(): void {
    const palabras = this.filtroTexto.trim().split(/\s+/); // Separa por espacios y elimina espacios extra
    if (palabras.length > 25) {
      // Si el número de palabras es mayor a 25, recorta el texto a las primeras 25 palabras
      this.filtroTexto = palabras.slice(0, 25).join(' ');
    }
  }

  prevenirEspaciosExcesivos(event: KeyboardEvent): void {
    const textoActual = this.filtroTexto.trim(); // Eliminar los espacios al principio y final
    
    // Verifica si el evento es la barra espaciadora
    if (event.key === ' ') {
      // Permite el espacio solo si el texto actual no termina en espacio
      if (textoActual !== '' && textoActual.slice(-1) !== ' ') {
        return; // Permitir el espacio si no es el último carácter
      }
      event.preventDefault();  // Bloquea el espacio si ya hay un espacio al final
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
        this.estudiantesFiltrados = [...this.estudiantes]; // Restablece la lista de estudiantes
      }
    }, 0); 
  }

  buscarEstudiantes(): void {
    const filtro = this.filtroTexto.trim().toLowerCase();  
    if (filtro) {
      this.estudiantesFiltrados = this.estudiantes.filter((estudiante) =>
        estudiante.data.nombres.toLowerCase().includes(filtro) ||
        estudiante.data.codUsuario.toLowerCase().includes(filtro)
      );
    } else {
      this.estudiantesFiltrados = [...this.estudiantes];  
    }
  }  

  toggleAutorizacion(estudiante: { key: string; data: Estudiante }): void {
    estudiante.data.autorizacion =
      estudiante.data.autorizacion === 'Autorizado' ? 'No Autorizado' : 'Autorizado';
    this.http
      .put(
        `https://shem-firebase-default-rtdb.firebaseio.com/estudiante/${estudiante.key}.json`,
        estudiante.data
      )
      .subscribe(
        () => {
          console.log('Autorización actualizada correctamente.');
          estudiante.data = { ...estudiante.data }; // Crear una copia para forzar el cambio
        },
        (error) => {
          console.error('Error al actualizar la autorización:', error);
        }
      );
  }

  actualizarCiclo(estudiante: { key: string; data: Estudiante }): void {
    this.http
      .put(
        `https://shem-firebase-default-rtdb.firebaseio.com/estudiante/${estudiante.key}.json`,
        estudiante.data
      )
      .subscribe(
        () => {
          // Mostrar el mensaje
          this.codigoActualizado = estudiante.data.codUsuario;
          this.cicloActualizado = estudiante.data.ciclo;
          this.mensajeVisible = true;
          
          // Forzar la detección de cambios para asegurar que el mensaje se muestre
          this.cdRef.detectChanges();

          setTimeout(() => {
            this.mensajeVisible = false;
            this.cdRef.detectChanges();  // Forzar actualización después de ocultar el mensaje
          }, 3000);
        },
        (error) => {
          console.error('Error al actualizar el ciclo:', error);
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

eliminarEstudiante(estudiantes: { key: string; data: Estudiante }): void {
  this.http
    .delete(
      `https://shem-firebase-default-rtdb.firebaseio.com/estudiante/${estudiantes.key}.json`
    )
    .subscribe(
      () => {
        // Eliminar el elemento de las listas
        this.estudiantes = this.estudiantes.filter(item => item.key !== estudiantes.key);
        this.estudiantesFiltrados = this.estudiantesFiltrados.filter(item => item.key !== estudiantes.key);

        // Ajustar la paginación en caso de que se elimine un elemento en la última página
        if (this.paginaActual * this.elementosPorPagina >= this.estudiantesFiltrados.length) {
          this.paginaActual = Math.max(0, this.paginaActual - 1);
        }

        // Mostrar el mensaje de eliminación
        this.nombreEliminado = estudiantes.data.nombres;
        this.codigoEliminado = estudiantes.data.codUsuario;
        this.mensajeVisibl = true;
        
        setTimeout(() => {
          this.mensajeVisibl = false;
          this.cdRef.detectChanges(); // Actualizar la vista después de ocultar el mensaje
        }, 3000);

        // Forzar la detección de cambios
        this.cdRef.detectChanges();
      },
      (error) => {
        console.error('Error al eliminar el Estudiantes:', error);
      }
    );
}


}


