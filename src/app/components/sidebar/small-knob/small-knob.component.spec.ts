import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmallKnobComponent } from './small-knob.component';

describe('SmallKnobComponent', () => {
  let component: SmallKnobComponent;
  let fixture: ComponentFixture<SmallKnobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmallKnobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmallKnobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
