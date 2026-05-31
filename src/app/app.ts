import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { LanguageService } from './core/services/language.service';
import { ConfirmDialogHostComponent } from './shared/ui/confirm-dialog/confirm-dialog-host.component';
import { ToastHostComponent } from './shared/ui/toast/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, ToastHostComponent, ConfirmDialogHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(LanguageService).init();
  }
}
