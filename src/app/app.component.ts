import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-app';

  currentSettings: any = {};

  updateSettings(newSettings: any) {
    this.currentSettings = { ...newSettings };
  }
}
