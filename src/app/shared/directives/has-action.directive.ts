import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';
import { AuthService } from '../../pages/auth/services/auth.service';

@Directive({
    selector: '[appHasAction]',
    standalone: true
})
export class HasActionDirective implements OnChanges {
    @Input('appHasAction') actions: string | string[] = [];
    @Input() appHasActionPath: string | string[] = [];

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly renderer: Renderer2,
        private readonly authService: AuthService
    ) {}

    ngOnChanges(): void {
        const hasAccess = this.authService.hasActionAccess(this.appHasActionPath, this.actions);
        this.renderer.setStyle(this.elementRef.nativeElement, 'display', hasAccess ? '' : 'none');
        this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-hidden', hasAccess ? 'false' : 'true');
    }
}
