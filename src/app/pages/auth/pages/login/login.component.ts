import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { StatusResponse } from '../../../../shared/interface/status-response.interface';
import { LoginDataResponse } from '../../interfaces';
import { UtilsService } from '../../../../shared/services/utils.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        PasswordModule,
        ButtonModule,
        CheckboxModule
    ],
    templateUrl: './login.component.html'
})
export class LoginComponent {
    form: FormGroup;
    errorMessages: string[] = [];
    loading$: Observable<boolean> = new Observable<boolean>();
    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private utils: UtilsService,
    ) {
        this.loading$ = this.authService.loading$; // Observable boolean
        this.form = this.fb.group({
            login: ['', [Validators.required]],
            password: ['', Validators.required],
            remember: [false]
        });
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.authService.login({
            login: this.form.value.login,
            password: this.form.value.password
        }).subscribe({
            next: (response: StatusResponse<LoginDataResponse>) => {
                if (response.ok && response.data?.token) {
                    this.authService.storeToken(response.data.token, this.form.value.remember);
                    this.router.navigate(['/']);
                } else {
                    this.errorMessages = this.utils.normalizeMessages(response.message);
                }
            },
            error: (err) => {
                this.errorMessages = this.utils.normalizeMessages(err?.error?.message);
            }
        });
    }
}
