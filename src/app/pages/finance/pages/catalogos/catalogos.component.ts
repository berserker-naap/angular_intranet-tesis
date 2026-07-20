import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import {
    CategoriaFinanceItem,
    EntidadFinancieraItem,
    FinanceCatalogosService,
    FinanceCategoryType,
    SubcategoriaFinanceItem
} from '../../services/finance-catalogos.service';

@Component({
    selector: 'app-finance-catalogos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        SelectModule,
        TableModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        LoadingOverlayComponent
    ],
    templateUrl: './catalogos.component.html',
    styleUrls: ['./catalogos.component.scss'],
    providers: [NotificationToastService]
})
export class FinanceCatalogosComponent implements OnInit {
    readonly loading$: Observable<boolean>;
    readonly entidades = signal<EntidadFinancieraItem[]>([]);
    readonly categorias = signal<CategoriaFinanceItem[]>([]);
    readonly subcategorias = signal<SubcategoriaFinanceItem[]>([]);

    readonly tiposCategoria = [
        { label: 'Todas', value: null },
        { label: 'Ingresos', value: 'INGRESO' as FinanceCategoryType },
        { label: 'Egresos', value: 'EGRESO' as FinanceCategoryType }
    ];

    selectedTipo: FinanceCategoryType | null = null;
    selectedCategoriaId: number | null = null;

    constructor(
        private readonly financeCatalogosService: FinanceCatalogosService,
        private readonly utils: UtilsService,
        private readonly notificationToast: NotificationToastService
    ) {
        this.loading$ = this.financeCatalogosService.loading$;
    }

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData(): void {
        forkJoin({
            entidades: this.financeCatalogosService.getEntidadesFinancieras(),
            categorias: this.financeCatalogosService.getCategorias(this.selectedTipo ?? undefined)
        }).subscribe({
            next: ({ entidades, categorias }) => {
                this.entidades.set(this.resolveData(entidades, 'entidades financieras'));

                const categoriasData = this.resolveData(categorias, 'categorias financieras');
                this.categorias.set(categoriasData);
                this.selectedCategoriaId = categoriasData[0]?.id ?? null;

                if (this.selectedCategoriaId) {
                    this.loadSubcategorias(this.selectedCategoriaId);
                } else {
                    this.subcategorias.set([]);
                }
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    onTipoChange(): void {
        this.selectedCategoriaId = null;
        this.subcategorias.set([]);
        this.loadInitialData();
    }

    onCategoriaChange(): void {
        if (!this.selectedCategoriaId) {
            this.subcategorias.set([]);
            return;
        }

        this.loadSubcategorias(this.selectedCategoriaId);
    }

    getTipoSeverity(tipo: FinanceCategoryType): 'success' | 'warn' {
        return tipo === 'INGRESO' ? 'success' : 'warn';
    }

    private loadSubcategorias(idCategoria: number): void {
        this.financeCatalogosService.getSubcategorias(idCategoria).subscribe({
            next: (response) => {
                this.subcategorias.set(this.resolveData(response, 'subcategorias financieras'));
            },
            error: (err) => {
                this.notificationToast.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    private resolveData<T>(response: { ok: boolean; message: string | string[]; data?: T[] }, label: string): T[] {
        if (response.ok && Array.isArray(response.data)) {
            return response.data;
        }

        this.notificationToast.error(this.utils.normalizeMessages(response.message), `No se pudo cargar ${label}`);
        return [];
    }
}
