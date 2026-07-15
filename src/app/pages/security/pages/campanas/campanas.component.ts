import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Observable } from 'rxjs';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { StatusResponse } from '../../../../shared/interface/status-response.interface';
import { NotificationToastService } from '../../../../shared/services/notification-toast.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { CampaignaItem, CampaignaPayload, CampaignasService } from '../../services/campaignas.service';

@Component({
    selector: 'app-campanas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        ToolbarModule,
        ToastModule,
        DialogModule,
        ConfirmDialogModule,
        InputTextModule,
        TextareaModule,
        InputSwitchModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        LoadingOverlayComponent
    ],
    templateUrl: './campanas.component.html',
    styleUrls: ['./campanas.component.scss'],
    providers: [MessageService, ConfirmationService, NotificationToastService]
})
export class CampanasComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    campaigns = signal<CampaignaItem[]>([]);
    selectedCampaign: CampaignaItem | null = null;
    campaignDialog = false;
    submitted = false;
    readonly loading$: Observable<boolean>;

    form!: FormGroup;

    constructor(
        private readonly campaignasService: CampaignasService,
        private readonly utils: UtilsService,
        private readonly confirmationService: ConfirmationService,
        private readonly fb: FormBuilder,
        private readonly notificationToastService: NotificationToastService
    ) {
        this.loading$ = this.campaignasService.loading$;
    }

    ngOnInit(): void {
        this.buildForm();
        this.loadData();
    }

    loadData(): void {
        this.campaignasService.findAll().subscribe({
            next: (response: StatusResponse<CampaignaItem[]>) => {
                if (response.ok && response.data) {
                    this.campaigns.set(response.data);
                    return;
                }
                this.notificationToastService.error(this.utils.normalizeMessages(response.message));
            },
            error: (err) => {
                this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    openNew(): void {
        this.selectedCampaign = null;
        this.submitted = false;
        this.buildForm();
        this.campaignDialog = true;
    }

    openEdit(campaign: CampaignaItem): void {
        if (campaign.status === 'SENT') {
            this.notificationToastService.warn('Las campañas enviadas ya no se pueden editar.');
            return;
        }
        this.selectedCampaign = campaign;
        this.submitted = false;
        this.buildForm(campaign);
        this.campaignDialog = true;
    }

    hideDialog(): void {
        this.campaignDialog = false;
        this.submitted = false;
        this.selectedCampaign = null;
        this.buildForm();
    }

    saveCampaign(): void {
        this.submitted = true;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload = this.buildPayload();

        if (this.selectedCampaign?.id) {
            this.campaignasService.update(this.selectedCampaign.id, payload).subscribe({
                next: (response: StatusResponse<CampaignaItem>) => {
                    if (response.ok && response.data) {
                        this.campaigns.set(
                            this.campaigns().map(item => item.id === response.data.id ? response.data : item)
                        );
                        this.notificationToastService.success('Campaña actualizada correctamente.');
                        this.hideDialog();
                        return;
                    }
                    this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                },
                error: (err) => {
                    this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                }
            });
            return;
        }

        this.campaignasService.create(payload).subscribe({
            next: (response: StatusResponse<CampaignaItem>) => {
                if (response.ok && response.data) {
                    this.campaigns.set([response.data, ...this.campaigns()]);
                    this.notificationToastService.success('Campaña creada correctamente.');
                    this.hideDialog();
                    return;
                }
                this.notificationToastService.error(this.utils.normalizeMessages(response.message));
            },
            error: (err) => {
                this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
            }
        });
    }

    sendCampaign(campaign: CampaignaItem): void {
        if (campaign.status === 'SENT') {
            this.notificationToastService.info('La campaña ya fue enviada.');
            return;
        }

        this.confirmationService.confirm({
            message: `¿Deseas enviar la campaña "${campaign.title}" a todos los usuarios?`,
            header: 'Confirmar envío',
            icon: 'pi pi-send',
            accept: () => {
                this.campaignasService.send(campaign.id).subscribe({
                    next: (response: StatusResponse<CampaignaItem>) => {
                        if (response.ok && response.data) {
                            this.campaigns.set(
                                this.campaigns().map(item => item.id === response.data.id ? response.data : item)
                            );
                            this.notificationToastService.success('Campaña enviada correctamente.');
                            return;
                        }
                        this.notificationToastService.error(this.utils.normalizeMessages(response.message));
                    },
                    error: (err) => {
                        this.notificationToastService.error(this.utils.normalizeMessages(err?.error?.message));
                    }
                });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getChannelsLabel(campaign: CampaignaItem): string {
        if (campaign.sendPush && campaign.publishInApp) {
            return 'Push + bandeja';
        }
        if (campaign.sendPush) {
            return 'Solo push';
        }
        return 'Solo bandeja';
    }

    getStatusSeverity(status: CampaignaItem['status']): 'success' | 'info' {
        return status === 'SENT' ? 'success' : 'info';
    }

    formatDate(value: string | null): string {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleString('es-PE', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    }

    private buildForm(campaign?: CampaignaItem): void {
        this.form = this.fb.group({
            title: [campaign?.title ?? '', [Validators.required, Validators.maxLength(120)]],
            message: [campaign?.message ?? '', [Validators.required, Validators.maxLength(500)]],
            deepLink: [campaign?.deepLink ?? '', [Validators.maxLength(500)]],
            sendPush: [campaign?.sendPush ?? true],
            publishInApp: [campaign?.publishInApp ?? true]
        });
    }

    private buildPayload(): CampaignaPayload {
        const value = this.form.getRawValue();
        return {
            title: String(value.title ?? '').trim(),
            message: String(value.message ?? '').trim(),
            deepLink: String(value.deepLink ?? '').trim() || null,
            sendPush: Boolean(value.sendPush),
            publishInApp: Boolean(value.publishInApp)
        };
    }
}
