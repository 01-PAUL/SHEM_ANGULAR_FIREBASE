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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';  // Asegúrate de importar la librería

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

async descargarPDF(): Promise<void> {
  const doc = new jsPDF('landscape'); // Orientación horizontal

  const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const titulo = 'Reporte de Estudiantes';
    doc.setFontSize(35);
    const tituloWidth = doc.getTextWidth(titulo);
    doc.text(titulo, (pageWidth - tituloWidth) / 2, 22);
    doc.setDrawColor(0, 0, 0);
    doc.line(10, 28, pageWidth - 10, 28); // Línea decorativa debajo del título
  
    // Fecha y hora en el encabezado centradas debajo de la línea
    const fecha = new Date();
    const fechaTexto = `Fecha y Hora de generación: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
    doc.setFontSize(10);
    const fechaTextoWidth = doc.getTextWidth(fechaTexto);
    doc.text(fechaTexto, (pageWidth - fechaTextoWidth) / 2, 34); // Ajusta la posición Y para estar justo debajo de la línea
  

  // Define las columnas 
  const columnas = [
    'ID', 'Nombre', 'Apellido', 'Código',
    'Tipo Documento', 'Documento', 'Carrera', 'Ciclo', 'Imagen', 'Autorización'
  ];

  // Genera las filas con las imágenes convertidas
  const filas = [];
  for (const estudiante of this.estudiantesFiltrados) {
    const imagenBase64 = await this.convertImageToBase64(estudiante.data.imageUrl);
    filas.push([
      estudiante.data.idEstudiante,
      estudiante.data.nombres,
      estudiante.data.apellidos,
      estudiante.data.codUsuario,
      this.getTipoDocumento(estudiante.data.idTipoDocumento),
      estudiante.data.numDocumento,
      estudiante.data.carrera,
      estudiante.data.ciclo,
      { content: '', image: imagenBase64 }, // Se incluye la imagen
      estudiante.data.autorizacion
    ]);
  }

  // Genera la tabla con jsPDF-Autotable
  (doc as any).autoTable({
    head: [columnas],
    body: filas,
    startY: 40, // Margen superior
    styles: {
      halign: 'center',
      valign: 'middle',
      cellPadding: 5,
      fontSize: 10,
      cellWidth: 'auto',
      overflow: 'linebreak',
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [0, 102, 204], // Color de fondo de la cabecera
      textColor: 255, // Texto blanco en la cabecera
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] // Color de fondo alternativo para las filas
    },
    theme: 'grid',
    rowPageBreak: 'avoid',
    didDrawCell: (data: any) => {
      if (data.column.index === 8 && data.cell.raw.image) {
        const fixedSize = 15; // Tamaño fijo de la imagen
        const x = data.cell.x + (data.cell.width - fixedSize) / 2;
        const y = data.cell.y + (data.cell.height - fixedSize) / 2;

        // Dibuja el fondo con bordes redondeados para la imagen
        const borderRadius = 5;
        // Dibuja la imagen dentro del rectángulo
        doc.addImage(data.cell.raw.image, 'JPEG', x, y, fixedSize, fixedSize);
      }
    },
    didDrawPage: (data: any) => {
      // Pie de página dinámico
      const pageNumber = data.pageNumber;
      doc.setFontSize(10);
      doc.text(`Página ${pageNumber}`, pageWidth - 30, pageHeight - 10);
    }
  });

  doc.save('Reporte_Estudiantes.pdf');
}

// Añade esta propiedad para el filtro de autorización
filtroAutorizacion: string = 'todos'; // Valor inicial, muestra todos los estudiantes

cambiarFiltro(filtro: string): void {
  this.filtroAutorizacion = filtro;
  this.filtrarEstudiantes();
}

filtrarEstudiantes(): void {
  this.estudiantesFiltrados = this.estudiantes.filter((estudiante) => {
    if (this.filtroAutorizacion === 'todos') {
      return true; // Muestra todos los estudiantes
    }
    if (this.filtroAutorizacion === 'autorizados') {
      return estudiante.data.autorizacion === 'Autorizado';
    }
    if (this.filtroAutorizacion === 'no_autorizados') {
      return estudiante.data.autorizacion === 'No Autorizado';
    }
    return false; // Caso por defecto, aunque no debería llegar aquí
  });
}

convertImageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Necesario para evitar problemas de CORS
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
  });
}

exportarExcel(): void {
  // Define la cabecera de las columnas
  const cabeceras = [
    'ID', 'NOMBRES', 'APELLIDOS', 'CÓD. USUARIO', 'TIPO DOCUMENTO', 'N° DOCUMENTO', 'CARRERA', 'CICLO', 'IMAGEN DEL USUARIO', 'AUTORIZACIÓN'
  ];

  // Mapea los datos a exportar
  const datos = this.estudiantesFiltrados.map(estudiante => ({
    'ID': estudiante.data.idEstudiante,
    'NOMBRES': estudiante.data.nombres,
    'APELLIDOS': estudiante.data.apellidos,
    'CÓD. USUARIO': estudiante.data.codUsuario,
    'TIPO DOCUMENTO': this.getTipoDocumento(estudiante.data.idTipoDocumento),
    'N° DOCUMENTO': estudiante.data.numDocumento,
    'CARRERA': estudiante.data.carrera,
    'CICLO': estudiante.data.ciclo,
    'IMAGEN DEL USUARIO': estudiante.data.imageUrl ? estudiante.data.imageUrl : 'No disponible',
    'AUTORIZACIÓN': estudiante.data.autorizacion
  }));

  // Crea la hoja de trabajo
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos, { header: cabeceras });

  // Anchos específicos para cada cabecera
  const columnWidths = [
    { wch: 5 },   // ID
    { wch: 20 },  // NOMBRES
    { wch: 20 },  // APELLIDOS
    { wch: 15 },  // CÓD. USUARIO
    { wch: 20 },  // TIPO DOCUMENTO
    { wch: 18 },  // N° DOCUMENTO
    { wch: 25 },  // CARRERA
    { wch: 10 },  // CICLO
    { wch: 90 },  // IMAGEN DEL USUARIO
    { wch: 15 }   // AUTORIZACIÓN
  ];

  worksheet['!cols'] = columnWidths;

  // Alineación hacia la izquierda para la columna de N° DOCUMENTO
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 5 }); // Columna N° DOCUMENTO
    if (!worksheet[cellAddress]) continue;
    if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
    worksheet[cellAddress].s.alignment = { horizontal: 'left' }; // Alineación a la izquierda
  }

  // Crea el libro de trabajo y añade la hoja
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

  // Escribe y descarga el archivo Excel
  XLSX.writeFile(workbook, 'Listado_Estudiantes.xlsx');
}

}


