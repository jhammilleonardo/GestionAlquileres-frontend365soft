import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideAngularModule, X, Wrench } from 'lucide-angular';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from '../../../core/models/maintenance-request.model';

@Component({
    selector: 'app-request-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        LucideAngularModule
    ],
    templateUrl: './request-form.component.html',
    styleUrl: './request-form.component.scss'
})
export class RequestFormComponent {
    private fb = inject(FormBuilder);
    private maintenanceService = inject(MaintenanceService);
    private dialogRef = inject(MatDialogRef<RequestFormComponent>);

    readonly X = X;
    readonly Wrench = Wrench;

    maintenanceForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(5)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
        propertyName: ['', Validators.required],
        propertyAddress: ['', Validators.required],
        tenantName: ['', Validators.required],
        tenantEmail: ['', [Validators.required, Validators.email]],
        tenantPhone: ['', Validators.required],
        category: [MaintenanceCategory.OTHER as MaintenanceCategory, Validators.required],
        priority: [MaintenancePriority.MEDIUM as MaintenancePriority, Validators.required],
        preferredAccessTime: [''],
        permissionToEnter: [true],
    });

    categories = Object.values(MaintenanceCategory);
    priorities = Object.values(MaintenancePriority);

    onSubmit(): void {
        if (this.maintenanceForm.valid) {
            const formValue = this.maintenanceForm.value;

            this.maintenanceService.createRequest({
                propertyId: 'PROP-' + Math.floor(Math.random() * 1000), // In a real app, this would be selected
                propertyName: formValue.propertyName as string,
                propertyAddress: formValue.propertyAddress as string,
                tenantId: 'TEN-' + Math.floor(Math.random() * 1000), // In a real app, this would be selected
                tenantName: formValue.tenantName as string,
                tenantEmail: formValue.tenantEmail as string,
                tenantPhone: formValue.tenantPhone as string,
                category: formValue.category as MaintenanceCategory,
                priority: formValue.priority as MaintenancePriority,
                status: MaintenanceStatus.PENDING,
                title: formValue.title as string,
                description: formValue.description as string,
                photos: [],
                permissionToEnter: !!formValue.permissionToEnter,
                preferredAccessTime: formValue.preferredAccessTime as string,
            });

            this.dialogRef.close(true);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
