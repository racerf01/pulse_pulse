import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  standalone: false
})
export class SliderComponent implements OnInit, OnChanges {
  @Input() label?: string;
  @Input() value: number = 0;          // expected 0…1
  @Output() valueChange = new EventEmitter<number>();

  knobPosition = 50;                   // in % (6…94)
  private dragging = false;
  private trackTop = 0;
  private trackHeight = 0;

  private moveListener!: () => void;
  private upListener!: () => void;

  // constants for your visual caps
  private readonly MIN_PCT = 6;
  private readonly MAX_PCT = 94;
  private readonly RANGE_PCT = this.MAX_PCT - this.MIN_PCT; // 88

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
    // map value (0…1) → knobPosition (6…94)
    this.knobPosition = this.MAX_PCT - this.value * this.RANGE_PCT;
  }

  startDrag(event: MouseEvent) {
    event.preventDefault();
    const track = this.elRef.nativeElement.querySelector('.slider-track');
    const rect = track.getBoundingClientRect();
    this.trackTop = rect.top;
    this.trackHeight = rect.height;
    this.dragging = true;

    this.moveListener = this.renderer.listen('window', 'mousemove', e => this.onDrag(e));
    this.upListener   = this.renderer.listen('window', 'mouseup',   () => this.endDrag());
  }

  onDrag(event: MouseEvent) {
    if (!this.dragging) return;

    // clamp pointer Y
    let y = Math.min(Math.max(event.clientY, this.trackTop), this.trackTop + this.trackHeight);
    // percent along the track
    const pct = ((y - this.trackTop) / this.trackHeight) * 100;
    // clamp to your visual range
    this.knobPosition = Math.min(this.MAX_PCT, Math.max(this.MIN_PCT, pct));

    // emit normalized value: invert the mapping
    const normalized = 1 - (this.knobPosition - this.MIN_PCT) / this.RANGE_PCT;
    this.valueChange.emit(normalized);
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    this.moveListener();
    this.upListener();

    // final emit (in case parent only cares on release)
    const normalized = 1 - (this.knobPosition - this.MIN_PCT) / this.RANGE_PCT;
    this.valueChange.emit(normalized);
  }
}
