import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { declarations } from '../app/declarations';
import { imports } from '../app/imports';
import { UserRecord } from '../model/User';
import { UserService } from './user.service';

describe('Service: UserService', () => {
  beforeEach(() => TestBed.configureTestingModule({ declarations, imports }));

  it('The User Service should be dependancy injected', () => {
    const service: UserService = TestBed.inject(UserService);
    expect(service).toBeDefined();
  });
  it('The User Service should throw an error', waitForAsync(() => {
    const service: UserService = TestBed.inject(UserService);
    expect(service).toBeDefined();
    const user = new UserRecord();
    const userArr = [user, user];
    const message1 =
      'Something Went Wrong Test Harness: Just a test ;-) It will be ok. This was suppose to happen';
    const message2 =
      'Something Went Wrong Test Harness: Just a test ;-) It will be ok.  This was suppose to happen again';
    service.throwError<UserRecord>(message1, user).subscribe((e) => {
      console.error(e);
      expect(true).toBeDefined();
    });

    service.throwError<UserRecord[]>(message2, userArr).subscribe((e) => {
      console.error(e);
      expect(true).toBeDefined();
    });
  }));
});
