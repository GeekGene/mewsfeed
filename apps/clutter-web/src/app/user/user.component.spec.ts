import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { declarations } from '../app/declarations';
import { imports } from '../app/imports';
import { UserComponent } from './user.component';

describe('Component: UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [...declarations, UserComponent],
      imports
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('The User Component should be initialized', () => {
    expect(component).toBeTruthy();
  });
});
