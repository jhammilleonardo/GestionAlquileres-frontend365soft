import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { AuthService } from '../../core/services/auth.service';
import { Property } from '../../core/models/property.model';

@Component({
    selector: 'app-property-detail-admin',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './property-detail-admin.component.html',
    styleUrls: ['./property-detail-admin.component.scss']
})
export class PropertyDetailAdminComponent implements OnInit {
    property = signal<Property | null>(null);
    currentImageIndex = signal(0);
    isLoading = signal(true);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private propertyService: PropertyService,
        private authService: AuthService
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
                    alert('Propiedad no encontrada');
                    this.goBack();
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading property:', error);
                alert('Error al cargar la propiedad');
                this.isLoading.set(false);
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
            // El path viene como: storage/properties/soft-prueba/8/filename.jpg
            // Solo agregamos el dominio: http://localhost:3000/storage/properties/soft-prueba/8/filename.jpg
            return `http://localhost:3000/${imagePath}`;
        }
        return imagePath;
    }

    getThumbnailUrl(imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;

        // El path viene como: storage/properties/soft-prueba/8/filename.jpg
        // Solo agregamos el dominio: http://localhost:3000/storage/properties/soft-prueba/8/filename.jpg
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
        this.router.navigate(['../../'], { relativeTo: this.route });
    }

    editProperty(): void {
        // Navegar a modo edición o abrir modal
        this.router.navigate(['../'], { relativeTo: this.route, queryParams: { edit: this.property()?.id } });
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
        if (!status) return 'bg-gray-100 text-gray-800';

        const classes: Record<string, string> = {
            'DISPONIBLE': 'bg-green-100 text-green-800',
            'OCUPADO': 'bg-blue-100 text-blue-800',
            'MANTENIMIENTO': 'bg-yellow-100 text-yellow-800',
            'RESERVADO': 'bg-purple-100 text-purple-800',
            'INACTIVO': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }
}
