// colors-panel.component.ts
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector   : 'app-colors-panel',
  templateUrl: './colors-panel.component.html',
  styleUrls  : ['./colors-panel.component.scss'],
  standalone: false
})
export class ColorsPanelComponent {

  colors: string[] = [];

  /* <–– same “name” but now list ––> */
  @Output() colorsChange = new EventEmitter<string[]>();

  showColorPicker = false;
  toggleColorPicker() { this.showColorPicker = !this.showColorPicker; }

  private push() { this.colorsChange.emit([...this.colors]); }

  onColorPickerChange(e: Event) {
    this.colors.push((e.target as HTMLInputElement).value);
    this.showColorPicker = false;
    this.push();
  }

  selectColor(hex: string) {              // primary = bring to front
    this.colors = [hex, ...this.colors.filter(c => c !== hex)];
    this.push();
  }

  deleteColor(hex: string) {
    this.colors = this.colors.filter(c => c !== hex);
    this.push();
  }
}
