import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
    LucideAngularModule,
    ArrowLeft, Pencil, MapPin, DollarSign, Maximize2,
    BedDouble, Bath, Car, Calendar, CheckCircle2, XCircle,
    Home, CreditCard, PawPrint, Users, Package,
    Image as LucideImage, ChevronLeft, ChevronRight,
    FileText, Shield
} from 'lucide-angular';
import { PropertyService } from '../../core/services/property.service';
import { AuthService } from '../../core/services/auth.service';
import { SlugService } from '../../core/services/slug.service';
import { Property } from '../../core/models/property.model';

@Component({
    selector: 'app-property-detail-admin',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatDividerModule,
        MatSnackBarModule,
        LucideAngularModule
    ],
    templateUrl: './property-detail-admin.component.html',
    styleUrls: ['./property-detail-admin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyDetailAdminComponent implements OnInit {
    // Icons
    readonly ArrowLeft = ArrowLeft;
    readonly Pencil = Pencil;
    readonly MapPin = MapPin;
    readonly DollarSign = DollarSign;
    readonly Maximize2 = Maximize2;
    readonly BedDouble = BedDouble;
    readonly Bath = Bath;
    readonly Car = Car;
    readonly Calendar = Calendar;
    readonly CheckCircle2 = CheckCircle2;
    readonly XCircle = XCircle;
    readonly Home = Home;
    readonly CreditCard = CreditCard;
    readonly PawPrint = PawPrint;
    readonly Users = Users;
    readonly Package = Package;
    readonly LucideImage = LucideImage;
    readonly ChevronLeft = ChevronLeft;
    readonly ChevronRight = ChevronRight;
    readonly FileText = FileText;
    readonly Shield = Shield;

    property = signal<Property | null>(null);
    currentImageIndex = signal(0);
    isLoading = signal(true);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private propertyService: PropertyService,
        private authService: AuthService,
        private slugService: SlugService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const propertyIdStr = this.route.snapshot.paramMap.get('id');
        if (propertyIdStr) {
            const propertyId = parseInt(propertyIdStr, 10);
            this.loadPropertyDetail(propertyId);
        }
    }

    loadPropertyDetail(id: number): void {
        this.isLoading.set(true);
        this.propertyService.getAdminPropertyById(id).subscribe({
            next: (property) => {
                if (property) {
                    this.property.set(property);
                } else {
                    this.snackBar.open('Propiedad no encontrada', 'Cerrar', { duration: 3000 });
                    this.goBack();
                }
                this.isLoading.set(false);
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error loading property:', error);
                this.snackBar.open('Error al cargar la propiedad', 'Cerrar', { duration: 3000 });
                this.isLoading.set(false);
                this.cdr.markForCheck();
                this.goBack();
            }
        });
    }

    getImagesArray(): string[] {
        const prop = this.property();
        if (!prop?.images) return [];
        if (Array.isArray(prop.images)) return prop.images;
        return [];
    }

    getCurrentImage(): string {
        const images = this.getImagesArray();
        const index = this.currentImageIndex();
        const imagePath = images[index] || '';

        if (imagePath && !imagePath.startsWith('http')) {
            return `http://localhost:3000/${imagePath}`;
        }
        return imagePath;
    }

    getThumbnailUrl(imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:3000/${imagePath}`;
    }

    nextImage(): void {
        const images = this.getImagesArray();
        if (images.length > 0) {
            this.currentImageIndex.set((this.currentImageIndex() + 1) % images.length);
        }
    }

    previousImage(): void {
        const images = this.getImagesArray();
        if (images.length > 0) {
            const newIndex = (this.currentImageIndex() - 1 + images.length) % images.length;
            this.currentImageIndex.set(newIndex);
        }
    }

    selectImage(index: number): void {
        this.currentImageIndex.set(index);
    }

    goBack(): void {
        const slug = this.slugService.getSlug() || '';
        this.router.navigate([`/${slug}/propiedades`]);
    }

    editProperty(): void {
        const slug = this.slugService.getSlug() || '';
        this.router.navigate([`/${slug}/propiedades`], { queryParams: { edit: this.property()?.id } });
    }

    getPropertyAddress(): string {
        const prop = this.property();
        if (prop?.addresses && prop.addresses.length > 0) {
            const addr = prop.addresses[0];
            return `${addr.street_address}, ${addr.city}, ${addr.country}`;
        }
        return 'Sin dirección';
    }

    getStatusClass(): string {
        const status = this.property()?.status;
        if (!status) return 'status-default';

        const classes: Record<string, string> = {
            'DISPONIBLE': 'status-disponible',
            'OCUPADO': 'status-ocupado',
            'MANTENIMIENTO': 'status-mantenimiento',
            'RESERVADO': 'status-reservado',
            'INACTIVO': 'status-inactivo'
        };
        return classes[status] || 'status-default';
    }
}
