import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog'; // Importa MatDialogRef para cerrar el modal

@Component({
  selector: 'app-success-dialog',
  templateUrl: './success-dialog.component.html',
  styleUrl: './success-dialog.component.css',
})
export class SuccessDialogComponent {
  constructor(public dialogRef: MatDialogRef<SuccessDialogComponent>) {}

  onAccept(): void {
    this.dialogRef.close(); 
  }
}
