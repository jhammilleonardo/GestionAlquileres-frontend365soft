import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Home, Search, CheckCircle, Star, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  readonly Home = Home;
  readonly Search = Search;
  readonly CheckCircle = CheckCircle;
  readonly Star = Star;
  readonly ArrowRight = ArrowRight;

  private router = inject(Router);

  navigateToProperties() {
    this.router.navigate(['../propiedades'], { relativeTo: this.router.routerState.root });
  }

  navigateToContact() {
    this.router.navigate(['../contacto'], { relativeTo: this.router.routerState.root });
  }

  navigateToAbout() {
    this.router.navigate(['../nosotros'], { relativeTo: this.router.routerState.root });
  }
}
