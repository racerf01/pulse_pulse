import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediumKnobComponent } from './medium-knob.component';

describe('MediumKnobComponent', () => {
  let component: MediumKnobComponent;
  let fixture: ComponentFixture<MediumKnobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediumKnobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediumKnobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
