import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MessagesComponent } from './messages.component';

describe('Component: MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MessagesComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('The Message Component should be initialized', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
