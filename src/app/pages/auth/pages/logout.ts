import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: '',
})
export class Logout implements OnInit {

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.logout();            // Limpia token, flags, etc.
    this.router.navigate(['/auth/login']); // Redirige al login
  }
}
