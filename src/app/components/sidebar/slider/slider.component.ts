import { Component, ElementRef, Input, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-slider',
  standalone: false,
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent {
  @Input() label?: string;

  knobPosition = 50;  // Start in the middle (0% = top, 100% = bottom)
  private dragging = false;
  private trackTop = 0;
  private trackHeight = 0;

  private moveListener!: () => void;
  private upListener!: () => void;

  constructor(private elRef: ElementRef, private renderer: Renderer2) {}

  startDrag(event: MouseEvent) {
    event.preventDefault();

    // Get the track's position and size
    const track = this.elRef.nativeElement.querySelector('.slider-track');
    const rect = track.getBoundingClientRect();
    this.trackTop = rect.top;
    this.trackHeight = rect.height;

    // Indicate we are dragging
    this.dragging = true;

    // Listen for mousemove and mouseup on the window
    this.moveListener = this.renderer.listen('window', 'mousemove', (e) => this.onDrag(e));
    this.upListener = this.renderer.listen('window', 'mouseup', () => this.endDrag());
  }

  onDrag(event: MouseEvent) {
    if (!this.dragging) return;

    let y = event.clientY;

    // Constrain the knob to stay within the track
    const maxY = this.trackTop + this.trackHeight;
    if (y < this.trackTop) y = this.trackTop;
    if (y > maxY) y = maxY;

    // Calculate the offset within the track
    const offset = y - this.trackTop;
    // Convert to percentage
    const percent = (offset / this.trackHeight) * 100;

    this.knobPosition = percent;
  }

  endDrag() {
    this.dragging = false;
    // Detach event listeners
    if (this.moveListener) this.moveListener();
    if (this.upListener) this.upListener();
  }
}
