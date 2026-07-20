import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../pages/auth/services/auth.service';
import { HasActionDirective } from './has-action.directive';

@Component({
    standalone: true,
    imports: [HasActionDirective],
    template: '<button appHasAction="Editar" appHasActionPath="/security/usuarios">Editar</button>'
})
class HostComponent {}

describe('HasActionDirective', () => {
    function createFixture(hasAccess: boolean): ComponentFixture<HostComponent> {
        TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        hasActionAccess: () => hasAccess
                    }
                }
            ]
        });

        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        return fixture;
    }

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('muestra el elemento cuando la accion esta permitida', () => {
        const fixture = createFixture(true);
        const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLElement;

        expect(button.style.display).toBe('');
        expect(button.getAttribute('aria-hidden')).toBe('false');
    });

    it('oculta el elemento cuando la accion no esta permitida', () => {
        const fixture = createFixture(false);
        const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLElement;

        expect(button.style.display).toBe('none');
        expect(button.getAttribute('aria-hidden')).toBe('true');
    });
});
