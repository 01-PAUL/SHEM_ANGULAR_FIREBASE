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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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

async descargarPDF(): Promise<void> {
  const doc = new jsPDF('landscape'); // Orientación horizontal

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const titulo = 'Reporte de Personal Administrativo';
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


  // Columnas
  const columnas = ['ID', 'Nombre', 'Apellido', 'Código', 'Tipo Documento', 'Documento', 'Cargo', 'Imagen', 'Autorización'];
  const filas = [];
  
  for (const docente of this.personalAdminFiltrados) {
      const imagenBase64 = await this.convertImageToBase64(docente.data.imageUrl);
      filas.push([
        docente.data.idPersonalAdministrativo,
        docente.data.nombres,
        docente.data.apellidos,
        docente.data.codUsuario,
        this.getTipoDocumento(docente.data.idTipoDocumento),
        docente.data.numDocumento,
        docente.data.cargo,
        { image: imagenBase64 }, // Aquí va la imagen
        docente.data.autorizacion
    ]);
    
  }

  // Genera la tabla con jsPDF-Autotable
  (doc as any).autoTable({
    head: [columnas],
    body: filas,
    startY: 40,
    styles: {
      halign: 'center',
      valign: 'middle',
      cellPadding: 5,
      fontSize: 10,
      cellWidth: 'auto',
      overflow: 'linebreak',
      lineWidth: 0.5
    },
    headStyles: { fillColor: [0, 102, 204], textColor: 255 },
    didDrawCell: (data: any) => {
      // Asegúrate de que se evalúe la columna de imágenes (índice correcto)
      if (data.column.index === 7 && data.cell.raw?.image) { // Ajusta el índice según la posición
          const size = 12; // Tamaño de la imagen
          const x = data.cell.x + (data.cell.width - size) / 2;
          const y = data.cell.y + (data.cell.height - size) / 2;
          doc.addImage(data.cell.raw.image, 'JPEG', x, y, size, size);
      }
    },  
    didDrawPage: (data: any) => {
        doc.setFontSize(10);
        doc.text(`Página ${data.pageNumber}`, pageWidth - 30, pageHeight - 10);
    }
});

  doc.save('Reporte_PersonalAdmin.pdf');
}

// Añade esta propiedad para el filtro de autorización
filtroAutorizacion: string = 'todos'; // Valor inicial, muestra todos los estudiantes

cambiarFiltro(filtro: string): void {
  this.filtroAutorizacion = filtro;
  this.filtrarEstudiantes();
}

filtrarEstudiantes(): void {
  this.personalAdminFiltrados = this.personalAdmin.filter((personalAdmi) => {
    if (this.filtroAutorizacion === 'todos') {
      return true; // Muestra todos los estudiantes
    }
    if (this.filtroAutorizacion === 'autorizados') {
      return personalAdmi.data.autorizacion === 'Autorizado';
    }
    if (this.filtroAutorizacion === 'no_autorizados') {
      return personalAdmi.data.autorizacion === 'No Autorizado';
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
    'ID', 'NOMBRES', 'APELLIDOS', 'CÓD. USUARIO', 'TIPO DOCUMENTO', 'N° DOCUMENTO', 'IMAGEN DEL USUARIO', 'AUTORIZACIÓN'
  ];

  // Mapea los datos a exportar
  const datos = this.personalAdminFiltrados.map(personalAdmi => ({
    'ID': personalAdmi.data.idPersonalAdministrativo,
    'NOMBRES': personalAdmi.data.nombres,
    'APELLIDOS': personalAdmi.data.apellidos,
    'CÓD. USUARIO': personalAdmi.data.codUsuario,
    'TIPO DOCUMENTO': this.getTipoDocumento(personalAdmi.data.idTipoDocumento),
    'N° DOCUMENTO': personalAdmi.data.numDocumento,
    'CARGO': personalAdmi.data.cargo,
    'IMAGEN DEL USUARIO': personalAdmi.data.imageUrl ? personalAdmi.data.imageUrl : 'No disponible',
    'AUTORIZACIÓN': personalAdmi.data.autorizacion
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PersonalAdmin');

  // Escribe y descarga el archivo Excel
  XLSX.writeFile(workbook, 'Listado_Estudiantes.xlsx');
}

}





