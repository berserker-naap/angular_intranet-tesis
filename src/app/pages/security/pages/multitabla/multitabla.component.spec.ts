/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MultitablaComponent } from './multitabla.component';

describe('MultitablaComponent', () => {
  let component: MultitablaComponent;
  let fixture: ComponentFixture<MultitablaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultitablaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultitablaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
