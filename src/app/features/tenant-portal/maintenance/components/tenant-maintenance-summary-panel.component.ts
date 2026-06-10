import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AlertCircle, Clock, Home, Link, LucideAngularModule, Wrench } from 'lucide-angular';

import {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../../core/models/maintenance-request.model';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppStatusBadgeComponent, AppStatusTone } from '../../../../shared/ui';

@Component({
  selector: 'app-tenant-maintenance-summary-panel',
  imports: [LucideAngularModule, TranslocoModule, TenantDatePipe, AppStatusBadgeComponent],
  template: `
    <section class="summary-panel">
      <div class="status-banner" [class]="'banner-' + request().status.toLowerCase()">
        <div class="banner-body">
          <div class="banner-icon">
            <lucide-icon [img]="Wrench" [size]="22"></lucide-icon>
          </div>
          <div class="banner-text">
            <span class="banner-type">
              {{
                request().request_type === 'MAINTENANCE'
                  ? ('public.tenantMaintenance.maintenanceType' | transloco)
                  : ('public.tenantMaintenance.generalType' | transloco)
              }}
            </span>
            <span class="banner-title">{{ request().title }}</span>
          </div>
        </div>
        <div class="banner-badges">
          <app-status-badge
            [tone]="getStatusTone(request().status)"
            [label]="'public.tenantMaintenance.status.' + request().status | transloco"
          />
          <app-status-badge
            [tone]="getPriorityTone(request().priority)"
            [label]="'public.tenantMaintenance.priority.' + request().priority | transloco"
          />
        </div>
      </div>

      <div class="content-card">
        @if (request().category) {
          <div class="cc-row">
            <span class="cat-chip">
              <lucide-icon [img]="Link" [size]="13"></lucide-icon>
              {{ 'public.tenantMaintenance.category.' + request().category! | transloco }}
            </span>
          </div>
        }

        <div class="cc-section">
          <div class="cc-label">{{ 'public.tenantMaintenance.description' | transloco }}</div>
          <div class="cc-desc">{{ request().description }}</div>
        </div>

        <div class="cc-section">
          <div class="cc-label">{{ 'public.tenantMaintenance.information' | transloco }}</div>
          <div class="meta-grid">
            @if (request().property) {
              <div class="meta-card">
                <div class="meta-icon home">
                  <lucide-icon [img]="Home" [size]="16"></lucide-icon>
                </div>
                <div class="meta-text">
                  <span class="meta-lbl">{{
                    'public.tenantMaintenance.property' | transloco
                  }}</span>
                  <span class="meta-val">{{ request().property!.title }}</span>
                </div>
              </div>
            }
            <div class="meta-card">
              <div class="meta-icon created">
                <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
              </div>
              <div class="meta-text">
                <span class="meta-lbl">{{ 'public.tenantMaintenance.createdAt' | transloco }}</span>
                <span class="meta-val">{{ request().created_at | tenantDate }}</span>
              </div>
            </div>
            @if (request().due_date) {
              <div class="meta-card">
                <div class="meta-icon updated">
                  <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                </div>
                <div class="meta-text">
                  <span class="meta-lbl">{{ 'public.tenantMaintenance.dueDate' | transloco }}</span>
                  <span class="meta-val">{{ request().due_date | tenantDate }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        @if (request().request_type === 'MAINTENANCE') {
          <div class="cc-section access-section">
            <div class="cc-label">{{ 'public.tenantMaintenance.access' | transloco }}</div>
            <div class="access-row">
              <span class="access-key">{{
                'public.tenantMaintenance.permissionTitle' | transloco
              }}</span>
              <span class="access-val">
                {{
                  'public.tenantMaintenance.permission.' + request().permission_to_enter | transloco
                }}
              </span>
            </div>
            @if (request().has_pets) {
              <div class="pets-warning">
                <lucide-icon [img]="AlertCircle" [size]="14"></lucide-icon>
                {{ 'public.tenantMaintenance.petsWarning' | transloco }}
              </div>
            }
            @if (request().entry_notes) {
              <div class="access-row">
                <span class="access-key">{{ 'public.tenantMaintenance.notes' | transloco }}</span>
                <span class="access-val">{{ request().entry_notes }}</span>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .summary-panel {
      display: flex;
      flex-direction: column;
    }

    .status-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      border-radius: 14px 14px 0 0;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
      gap: 12px;
      flex-wrap: wrap;
    }

    .banner-body {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      min-width: 0;
    }

    .banner-icon {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .banner-type {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      opacity: 0.85;
    }

    .banner-title {
      font-size: 1.1rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .banner-badges {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .content-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 14px 14px;
      padding: 20px 22px 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .cc-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      background: #eff6ff;
      color: var(--app-color-primary);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #bfdbfe;
    }

    .cc-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cc-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #94a3b8;
    }

    .cc-desc {
      color: #475569;
      font-size: 14px;
      line-height: 1.65;
      padding-left: 12px;
      border-left: 3px solid #e2e8f0;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .meta-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .meta-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .meta-icon.home {
      background: #eff6ff;
      color: #3b82f6;
    }

    .meta-icon.contract {
      background: #f5f3ff;
      color: #7c3aed;
    }

    .meta-icon.created {
      background: #ecfdf5;
      color: #10b981;
    }

    .meta-icon.updated {
      background: #fff7ed;
      color: #f59e0b;
    }

    .meta-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .meta-lbl {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }

    .meta-val {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .access-section {
      gap: 8px;
    }

    .access-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .access-key {
      font-size: 13px;
      color: #64748b;
    }

    .access-val {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      text-align: right;
    }

    .pets-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #f59e0b;
      padding: 8px 12px;
      background: #fffbeb;
      border-radius: 8px;
      border: 1px solid #fde68a;
    }

    @media (max-width: 600px) {
      .meta-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantMaintenanceSummaryPanelComponent {
  readonly request = input.required<MaintenanceRequest>();

  readonly AlertCircle = AlertCircle;
  readonly Clock = Clock;
  readonly Home = Home;
  readonly Link = Link;
  readonly Wrench = Wrench;

  getStatusTone(status: MaintenanceStatus): AppStatusTone {
    const toneByStatus: Record<MaintenanceStatus, AppStatusTone> = {
      [MaintenanceStatus.NEW]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warning',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.DEFERRED]: 'warning',
      [MaintenanceStatus.CLOSED]: 'neutral',
    };

    return toneByStatus[status];
  }

  getPriorityTone(priority: MaintenancePriority): AppStatusTone {
    const toneByPriority: Record<MaintenancePriority, AppStatusTone> = {
      [MaintenancePriority.LOW]: 'success',
      [MaintenancePriority.NORMAL]: 'warning',
      [MaintenancePriority.HIGH]: 'danger',
    };

    return toneByPriority[priority];
  }
}
