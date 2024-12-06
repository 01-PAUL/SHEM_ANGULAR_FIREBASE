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

  currentUser: { email: string; username: string } | null = null;
  isChatbotOpen = false;
  chatStep = 0;
  chatSteps = [
    "Este es el menú INICIO, donde puedes encontrar información principal del sistema.",
    "En REGISTROS, puedes gestionar los datos de usuarios registrados.",
    "En MANTENIMIENTO, se administran datos de estudiantes, docentes y personal administrativo.",
    "En CERRAR SESIÓN, puedes finalizar tu sesión de manera segura."
  ];

  totalImages = 3;
  currentImageIndex = 0;

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.currentUser = {
          email: user.email!,
          username: user.displayName!
        };
      } else {
        this.currentUser = null;
      }
    });

    this.startCarousel();
  }

  startCarousel() {
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.totalImages;
    }, 3000);
  }

  getImageClass(): string {
    return `image${this.currentImageIndex + 1}`;
  }

  toggleChatbot() {
    this.isChatbotOpen = !this.isChatbotOpen;
    if (!this.isChatbotOpen) {
      this.chatStep = 0;
    }
  }

  startChat() {
    this.chatStep = 1;
  }

  nextStep() {
    if (this.chatStep < 4) {
      this.chatStep++;
    }
  }

  previousStep() {
    if (this.chatStep > 0) {
      this.chatStep--;
    }
  }

  highlightMenu(menuId: string) {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item) => {
      item.classList.remove('highlight');
      item.classList.add('opaque');
    });

    const highlightedMenu = document.getElementById(menuId);
    if (highlightedMenu) {
      highlightedMenu.classList.add('highlight');
    }
  }

  finishChat() {
    this.chatStep = 5;
  }

  closeChatbot() {
    this.isChatbotOpen = false;
    this.chatStep = 0;
  }
}