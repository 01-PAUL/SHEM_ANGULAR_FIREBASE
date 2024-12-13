import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatDialog } from '@angular/material/dialog'; 
import { SuccessDialogComponent } from '../success-dialog/success-dialog.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule]  
})
export class UsuarioComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  form = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email, // Validación de formato general de email
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|edu\.pe)$/), // Dominio específico permitido
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6), // Validación de longitud mínima
      ],
    ],
  });
  
  errorMessage: string | null = null;

  onSubmit(): void {
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();

    this.authService.register(email, password).subscribe({
      next: () => {
        const dialogRef = this.dialog.open(SuccessDialogComponent, {
          data: { message: 'Registro exitoso' },
        });

        dialogRef.afterClosed().subscribe(() => {
          this.form.reset(); // Limpia los campos
          this.router.navigateByUrl('register'); // Redirige a la página de inicio o la ruta que desees
        });
      },
      error: (err) => {
        this.errorMessage = this.authService.getErrorMessage(err.code);
      },
    });
  }
}
