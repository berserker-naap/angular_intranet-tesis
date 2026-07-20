import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../auth/services/auth.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { PermisoService } from '../../services/permiso.service';
import { RolesService } from '../../services/roles.service';
import { PermisosComponent } from './permisos.component';

describe('PermisosComponent', () => {
  let component: PermisosComponent;
  let fixture: ComponentFixture<PermisosComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PermisosComponent],
      providers: [
        {
          provide: RolesService,
          useValue: {
            loading$: of(false),
            findAll: () => of({ ok: true, message: 'ok', data: [] })
          }
        },
        {
          provide: PermisoService,
          useValue: {
            loading$: of(false),
            getPermisosPorRol: () => of({ ok: true, message: 'ok', data: [] }),
            actualizarPermisos: () => of({ ok: true, message: 'ok' })
          }
        },
        {
          provide: UtilsService,
          useValue: {
            normalizeMessages: (value: string | string[]) => value
          }
        },
        {
          provide: AuthService,
          useValue: {
            hasActionAccess: () => true
          }
        }
      ]
    });

    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PermisosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
