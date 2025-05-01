import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';

@Component({
  selector   : 'app-colors-panel',
  templateUrl: './colors-panel.component.html',
  styleUrls  : ['./colors-panel.component.scss'],
  standalone : false
})
export class ColorsPanelComponent implements OnChanges {
  /** Always work with exactly five hex strings */
  @Input()  colors!: string[];
  @Output() colorsChange = new EventEmitter<string[]>();

  @ViewChild('panelContainer', { static: true })
  panelContainer!: ElementRef<HTMLElement>;

  showColorPicker   = false;
  private editingIndex: number | null = null;
  editingColor      = '#ffffff';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['colors']) {
      const incoming = changes['colors'].currentValue as string[];
      this.colors = incoming.slice(0, 5);
      while (this.colors.length < 5) {
        this.colors.push('#ffffff');
      }
    }
  }

  openPickerAt(idx: number) {
    this.editingIndex = idx;
    this.editingColor = this.colors[idx];
    this.showColorPicker = true;
  }

  onColorPickerChange(e: Event) {
    const hex = (e.target as HTMLInputElement).value;
    if (this.editingIndex !== null) {
      this.colors[this.editingIndex] = hex;
    }
    this.hidePickerAndEmit();
  }

  onHexInputChange(e: Event) {
    const hex = (e.target as HTMLInputElement).value;
    this.editingColor = hex;
    if (this.editingIndex !== null && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
      this.colors[this.editingIndex] = hex;
      this.emitColors();
    }
  }

  resetColor(idx: number) {
    this.colors[idx] = '#ffffff';
    this.emitColors();
  }

  private hidePickerAndEmit() {
    this.showColorPicker = false;
    this.editingIndex = null;
    this.emitColors();
  }

  private emitColors() {
    this.colorsChange.emit([...this.colors]);
  }

  /** Close picker when clicking outside the panelContainer */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.showColorPicker &&
      this.panelContainer &&
      !this.panelContainer.nativeElement.contains(event.target as Node)
    ) {
      this.hidePickerAndEmit();
    }
  }
}
