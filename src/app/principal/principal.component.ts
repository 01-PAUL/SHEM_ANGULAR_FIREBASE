import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css']
})
export class PrincipalComponent implements OnInit {
  authService = inject(AuthService);

  // Número de imágenes
  totalImages = 3;
  currentImageIndex = 0;

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.authService.currentUserSig.set({
          email: user.email!,
          username: user.displayName!,
        });
      } else {
        this.authService.currentUserSig.set(null);
      }
    });

    // Inicia el carrusel automático
    this.startCarousel();
  }

  // Función para iniciar el carrusel
  startCarousel() {
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.totalImages;
    }, 3000); // Cambiar cada 3 segundos
  }

  // Obtener la clase dinámica
  getImageClass(): string {
    return `image${this.currentImageIndex + 1}`;
  }
}
