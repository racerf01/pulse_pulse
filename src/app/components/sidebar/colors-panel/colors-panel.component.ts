import { Component } from '@angular/core';

@Component({
  selector: 'app-colors-panel',
  templateUrl: './colors-panel.component.html',
  styleUrls: ['./colors-panel.component.scss'],
  standalone: false
})
export class ColorsPanelComponent {
  // Initial list of colors (using their hex values)
  colors: string[] = ['#0D2E70', '#4A6373', '#5E97B8', '#8AB9D8', '#124E8F'];
  
  // Controls if the color picker input is visible
  showColorPicker: boolean = false;

  // Toggle the display of the color picker input
  toggleColorPicker(): void {
    this.showColorPicker = !this.showColorPicker;
  }

  // When the user selects a color from the input, add it to the list and hide the picker
  onColorPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newColor = input.value; // Browser guarantees valid hex format
    this.colors.push(newColor);
    this.showColorPicker = false;
  }

  // Remove a color from the list when its swatch is clicked
  deleteColor(color: string): void {
    this.colors = this.colors.filter(c => c !== color);
  }
}
