import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AppMaterialModule } from '../app.material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Salida } from '../model/salida.model';
import { MatPaginator } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Ingreso } from '../model/ingreso.model';

@Component({
  selector: 'app-actualizar-salida',
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
  templateUrl: './actualizar-salida.component.html',
  styleUrl: './actualizar-salida.component.css'
})
export class ActualizarSalidaComponent {
  salida: { key: string; data: Salida }[] = [];
  salidaFiltrados: { key: string; data: Salida }[] = [];
  filtroTexto: string = '';
  paginaActual: number = 0;
  elementosPorPagina: number = 4;
  mensajeVisible: boolean = false;
  mensajeVisibl: boolean = false;
  maxPalabras: number = 25;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http
      .get<{ [key: string]: Salida }>(
        'https://shem-firebase-default-rtdb.firebaseio.com/Salida.json'
      )
      .subscribe((data) => {
        if (data) {
          this.salida = Object.entries(data)
          .filter(([key, item]) => item !== null && item.codigoUsuario)
          .map(([key, item]) => ({
            key,
            data: {
              ...item,
              autorizacion: '', // Campo inicial vacío
            },
          }));

  
          this.salida.forEach((sal) => {
            this.buscarAutorizacion(sal.data.codigoUsuario).then((autorizacion) => {
              sal.data.autorizacion = autorizacion;
            });
          });
  
          this.salidaFiltrados = [...this.salida];
        }
      });
  }
  
  private buscarAutorizacion(codigoUsuario: string): Promise<string> {
    return Promise.all(
        ['estudiante', 'docente', 'personalAdministrativo'].map((tabla) =>
            this.http
                .get<{ [key: string]: any }>(
                    `https://shem-firebase-default-rtdb.firebaseio.com/${tabla}.json`
                )
                .toPromise()
        )
    ).then((results) => {
        for (const data of results) {
            if (data) {
                const registros = Object.entries(data).filter(
                    ([, value]) => value !== null && value.codUsuario
                );
                const registro = registros.find(
                    ([, value]) => value.codUsuario === codigoUsuario
                );
                if (registro) {
                    return registro[1].autorizacion || 'No Autorizado';
                }
            }
        }
        return 'No Autorizado';
    });
}

toggleAutorizacion(ingreso: { key: string; data: Ingreso }): void {
  const nuevaAutorizacion =
      ingreso.data.autorizacion === 'Autorizado' ? 'No Autorizado' : 'Autorizado';
  
  const tablas = ['estudiante', 'docente', 'personalAdministrativo'];
  let encontrado = false;

  tablas.forEach((tabla) => {
      if (!encontrado) {
          this.http
              .get<{ [key: string]: any }>(
                  `https://shem-firebase-default-rtdb.firebaseio.com/${tabla}.json`
              )
              .subscribe((data) => {
                  if (data) {
                      const registros = Object.entries(data).filter(
                          ([, value]) => value !== null && value.codUsuario
                      );

                      const registro = registros.find(
                          ([, value]) => value.codUsuario === ingreso.data.codigoUsuario
                      );

                      if (registro) {
                          encontrado = true;
                          this.http
                              .put(
                                  `https://shem-firebase-default-rtdb.firebaseio.com/${tabla}/${registro[0]}.json`,
                                  { ...registro[1], autorizacion: nuevaAutorizacion }
                              )
                              .subscribe(
                                  () => {
                                      console.log('Autorización actualizada correctamente.');
                                      ingreso.data.autorizacion = nuevaAutorizacion;
                                      this.cdRef.detectChanges(); // Actualiza la vista.
                                  },
                                  (error) => console.error('Error al actualizar:', error)
                              );
                      }
                  }
              });
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
        this.salidaFiltrados = [...this.salida]; // Restablece la lista de estudiantes
      }
    }, 0); 
  }

  buscarSalida(): void {
    const filtro = this.filtroTexto.trim().toLowerCase();  
    if (filtro) {
      this.salidaFiltrados = this.salida.filter((salida) =>
        salida.data.usuario.toLowerCase().includes(filtro) ||
        salida.data.codigoUsuario.toLowerCase().includes(filtro)
      );
    } else {
      this.salidaFiltrados = [...this.salida];  
    }
  }  

  async descargarPDF(): Promise<void> {
      const doc = new jsPDF('landscape'); // Orientación horizontal
    
      // Configuración del título
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const titulo = 'Reporte de Salida de Usuarios';
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
        'Usuario', 'Código', 'Tipo Documento', 'Documento', 'Fecha Salida', 'Hora Salida', 'Tipo Micromovilidad', 'Imagen'
      ];
    
      // Genera las filas con las imágenes convertidas
      const filas = [];
      for (const salida of this.salidaFiltrados) {
        const imagenBase64 = await this.convertImageToBase64(salida.data.imageUrl);
        filas.push([
          salida.data.usuario,
          salida.data.codigoUsuario,
          salida.data.tipoDocumento,
          salida.data.numeroDocumento,
          salida.data.fechaSalida,
          salida.data.horaSalida,
          salida.data.micromovilidad,
          { image: imagenBase64 }
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
          // Asegúrate de que se evalúe la columna de imágenes (índice correcto)
          if (data.column.index === 7 && data.cell.raw?.image) { // Ajusta el índice según la posición
              const size = 12; // Tamaño de la imagen
              const x = data.cell.x + (data.cell.width - size) / 2;
              const y = data.cell.y + (data.cell.height - size) / 2;
              doc.addImage(data.cell.raw.image, 'JPEG', x, y, size, size);
          }
        }, 
        didDrawPage: (data: any) => {
          // Pie de página dinámico
          const pageNumber = data.pageNumber;
          doc.setFontSize(10);
          doc.text(`Página ${pageNumber}`, pageWidth - 30, pageHeight - 10);
        }
      });
    
      doc.save('Reporte_Salida.pdf');
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
    'USUARIO', 'CÓD. USUARIO', 'TIPO DOCUMENTO', 'N° DOCUMENTO', 'FECHA SALIDA', 'HORA SALIDA', 'TIPO MICROMOVILIDAD', 'IMAGEN DEL USUARIO'
  ];

  // Mapea los datos a exportar
  const datos = this.salidaFiltrados.map(salida => ({
    'USUARIO': salida.data.usuario,
    'CÓD. USUARIO': salida.data.codigoUsuario,
    'TIPO DOCUMENTO': salida.data.tipoDocumento,
    'N° DOCUMENTO': salida.data.numeroDocumento,
    'FECHA SALIDA': salida.data.fechaSalida,
    'HORA SALIDA': salida.data.horaSalida,
    'TIPO MICROMOVILIDAD': salida.data.micromovilidad,
    'IMAGEN DEL USUARIO': salida.data.imageUrl ? salida.data.imageUrl : 'No disponible',
  }));

  // Crea la hoja de trabajo
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos, { header: cabeceras });

  // Anchos específicos para cada cabecera
  const columnWidths = [
    { wch: 23 },  
    { wch: 15 },  
    { wch: 20 },  
    { wch: 15 }, 
    { wch: 20 },  
    { wch: 18 }, 
    { wch: 25 }, 
    { wch: 10 } 
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Salida');

  // Escribe y descarga el archivo Excel
  XLSX.writeFile(workbook, 'Listado_Estudiantes.xlsx');
}

}
