import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LogicComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  router = inject(Router);
  authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, noWhitespaceValidator]],
    password: ['', [Validators.required, noWhitespaceValidator]],
  });

  errorMessage: string | null = null;

  onSubmit(): void {
    if (this.form.invalid) {
      this.displayValidationErrors();
      return;
    }

    const rawForm = this.form.getRawValue();
    this.authService.login(rawForm.email, rawForm.password).subscribe({
      next: () => {
        this.router.navigateByUrl('/principal');
      },
      error: (err) => {
        this.errorMessage = this.authService.getErrorMessage(err.code);
      },
    });
    console.log('login');
  }

  displayValidationErrors(): void {
    if (this.form.get('email')?.hasError('required')) {
      this.errorMessage = 'Por favor, ingrese el email';
    } else if (this.form.get('email')?.hasError('whitespace')) {
      this.errorMessage = 'El email no puede contener espacios';
    } else if (this.form.get('password')?.hasError('required')) {
      this.errorMessage = 'Por favor, ingrese la contraseña';
    } else if (this.form.get('password')?.hasError('whitespace')) {
      this.errorMessage = 'La contraseña no puede contener espacios';
    }
  }

  onRegister(): void {
    this.router.navigateByUrl('/register');
  }
  
}

export function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const isWhitespace = (control.value || '').trim().length === 0;
  return isWhitespace ? { whitespace: true } : null;
}