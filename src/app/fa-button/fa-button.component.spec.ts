import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaButtonComponent } from './fa-button.component';

describe('FaButtonComponent', () => {
  let component: FaButtonComponent;
  let fixture: ComponentFixture<FaButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FaButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
