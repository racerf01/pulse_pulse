import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterKnobComponent } from './master-knob.component';

describe('MasterKnobComponent', () => {
  let component: MasterKnobComponent;
  let fixture: ComponentFixture<MasterKnobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterKnobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterKnobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
