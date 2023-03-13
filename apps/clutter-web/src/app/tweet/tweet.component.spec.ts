import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { declarations } from '../app/declarations';
import { imports } from '../app/imports';
import { TweetComponent } from './tweet.component';

describe('Component: TweetComponent', () => {
  let component: TweetComponent;
  let fixture: ComponentFixture<TweetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [...declarations, TweetComponent],
      imports
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(TweetComponent);
    component = fixture.componentInstance;
  }));

  it('The Tweet Component should be initialized.', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
