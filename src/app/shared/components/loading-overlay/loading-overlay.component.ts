import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 importa CommonModule

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule], // 👈 agrégalo aquí
  template: `
    <div *ngIf="loading" class="overlay">
      <div class="spinner">
        <i class="pi pi-spin pi-spinner text-4xl text-white"></i>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .spinner {
      text-align: center;
    }
  `]
})
export class LoadingOverlayComponent {
  @Input() loading: boolean = false;
}
