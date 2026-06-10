import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { AlertCircle, ArrowLeft, LucideAngularModule } from 'lucide-angular';

import { SlugService } from '../../../core/services/slug.service';
import { AppButtonComponent } from '../../../shared/ui';
import { TenantMaintenanceConversationComponent } from './components/tenant-maintenance-conversation.component';
import { TenantMaintenanceSummaryPanelComponent } from './components/tenant-maintenance-summary-panel.component';
import { TenantRequestDetailFacade } from './tenant-request-detail.facade';

@Component({
  selector: 'app-tenant-request-detail',
  standalone: true,
  imports: [
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    TenantMaintenanceConversationComponent,
    TenantMaintenanceSummaryPanelComponent,
  ],
  providers: [TenantRequestDetailFacade],
  template: `
    <div class="detail-container">
      <header class="page-header">
        <button type="button" [routerLink]="mantenimientoUrl()" class="back-btn">
          <lucide-icon [img]="ArrowLeft" [size]="22"></lucide-icon>
        </button>
        <div class="page-header-text">
          <h1>{{ 'public.tenantMaintenance.detailTitle' | transloco }}</h1>
          @if (facade.request()) {
            <span class="ticket-chip">{{ facade.request()?.ticket_number }}</span>
          }
        </div>
      </header>

      @if (facade.isLoading()) {
        <div class="detail-grid">
          <div class="skeleton-main">
            <div class="sk-banner"></div>
            <div class="sk-body">
              <div class="sk-line w60"></div>
              <div class="sk-line w40"></div>
              <div class="sk-line w100"></div>
              <div class="sk-line w80"></div>
            </div>
          </div>
          <div class="skeleton-conv">
            <div class="sk-line w40"></div>
            @for (i of [1, 2, 3]; track i) {
              <div class="sk-msg"></div>
            }
          </div>
        </div>
      } @else if (facade.request(); as request) {
        <div class="detail-grid">
          <app-tenant-maintenance-summary-panel [request]="request" />

          <app-tenant-maintenance-conversation
            [messages]="facade.messages()"
            [isLoading]="facade.isLoadingMessages()"
            [isSending]="facade.isSending()"
            [selectedFiles]="facade.selectedFiles()"
            [canSendMessage]="facade.canSendMessage()"
            [newMessagesCount]="facade.newMessagesCount()"
            [pollingNewFromId]="facade.pollingNewFromId()"
            [firstUnreadMessageId]="facade.firstUnreadMessageId()"
            [unreadCountFromHere]="facade.unreadCountFromHere()"
            [scrollVersion]="facade.scrollVersion()"
            [sentVersion]="facade.sentVersion()"
            [isMyMessage]="isMyMessage"
            (filesSelected)="facade.addFiles($event)"
            (removeFile)="facade.removeFile($event)"
            (messageSubmitted)="facade.sendMessage($event)"
            (conversationAtBottomChange)="facade.setConversationAtBottom($event)"
            (newMessagesOpened)="facade.scrollToNewMessages()"
          />
        </div>
      } @else {
        <div class="not-found">
          <lucide-icon [img]="AlertCircle" [size]="48"></lucide-icon>
          <h2>{{ 'public.tenantMaintenance.notFound' | transloco }}</h2>
          <p>{{ 'public.tenantMaintenance.notFoundDesc' | transloco }}</p>
          <app-button [routerLink]="mantenimientoUrl()">
            {{ 'public.tenantMaintenance.backToList' | transloco }}
          </app-button>
        </div>
      }
    </div>
  `,
  styles: `
    .detail-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 4px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .back-btn {
      display: inline-grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      color: #64748b;
      cursor: pointer;
    }

    .page-header-text h1 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 2px;
    }

    .ticket-chip {
      display: inline-block;
      font-size: 12px;
      font-family: monospace;
      color: var(--app-color-primary);
      background: #eff6ff;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 20px;
      align-items: start;
    }

    .skeleton-main,
    .skeleton-conv {
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .sk-banner {
      height: 80px;
      background: #dbeafe;
    }

    .sk-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sk-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    .sk-line.w100 {
      width: 100%;
    }

    .sk-line.w80 {
      width: 80%;
    }

    .sk-line.w60 {
      width: 60%;
    }

    .sk-line.w40 {
      width: 40%;
    }

    .sk-msg {
      height: 40px;
      border-radius: 10px;
      background: #f1f5f9;
      margin: 8px 16px;
    }

    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      color: #64748b;
      text-align: center;
      gap: 8px;
    }

    .not-found h2 {
      color: #1e293b;
      margin: 8px 0 4px;
    }

    @media (max-width: 900px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantRequestDetailComponent {
  protected readonly facade = inject(TenantRequestDetailFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly slugService = inject(SlugService);

  protected readonly AlertCircle = AlertCircle;
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly mantenimientoUrl = computed(() =>
    this.slugService.buildUrl('/portal/mantenimiento'),
  );
  protected readonly isMyMessage = this.facade.isMyMessage.bind(this.facade);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));

      if (Number.isFinite(id) && id > 0) {
        this.facade.loadRequest(id);
      }
    });
  }
}
