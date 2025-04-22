import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-slider',
  standalone: false,
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent implements OnInit, OnChanges {
  @Input() label?: string;
  @Input() value: number = 0; 
  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>();

  knobPosition = 50;  // starting value in percentage (0-100)
  private dragging = false;
  private trackTop = 0;
  private trackHeight = 0;

  private moveListener!: () => void;
  private upListener!: () => void;

  constructor(private elRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.updateKnobPosition();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.updateKnobPosition();
    }
  }

  private updateKnobPosition() {
    // map 0–1 value to 6–94% track range
    let p = this.value * 100;
    this.knobPosition = Math.min(94, Math.max(6, p));
  }

  startDrag(event: MouseEvent) {
    event.preventDefault();

    const track = this.elRef.nativeElement.querySelector('.slider-track');
    const rect = track.getBoundingClientRect();
    this.trackTop = rect.top;
    this.trackHeight = rect.height;
    this.dragging = true;

    this.moveListener = this.renderer.listen('window', 'mousemove', (e) => this.onDrag(e));
    this.upListener = this.renderer.listen('window', 'mouseup', () => this.endDrag());
  }

  onDrag(event: MouseEvent) {
    if (!this.dragging) return;
  
    let y = event.clientY;
    const maxY = this.trackTop + this.trackHeight;
    if (y < this.trackTop) y = this.trackTop;
    if (y > maxY) y = maxY;
  
    const offset = y - this.trackTop;
    let percent = (offset / this.trackHeight) * 100;
  
    // Cap the percentage at 90%
    if (percent < 6) {
      percent = 6;
    }

    if (percent > 94) {
      percent = 94;
    }
    
    this.knobPosition = percent;
    this.valueChange.emit(percent);
  }  

  endDrag() {
    this.dragging = false;
    if (this.moveListener) this.moveListener();
    if (this.upListener) this.upListener();
    
    // Optionally emit final value on drag end
    this.valueChange.emit(this.knobPosition);
  }
}
