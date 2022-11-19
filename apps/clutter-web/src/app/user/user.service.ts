import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UserRecord } from '../model/User';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userUrl = 'api/users'; // URL to web api

  constructor(private http: HttpClient) {
    this.getUsers();
  }

  initUser(): UserRecord {
    return new UserRecord();
  }

  /** GET users from the server */
  getUsers(): Observable<UserRecord[]> {
    return this.http
      .get<UserRecord[]>(this.userUrl)
      .pipe(
        catchError(this.handleError<UserRecord[]>('function: getUser', []))
      );
  }

  /** GET user by id. Will 404 if id not found */
  getUser(id: string): Observable<UserRecord> {
    if (id) {
      const url = `${this.userUrl}/${id}`;
      return this.http
        .get<UserRecord>(url)
        .pipe(
          catchError(
            this.handleError<UserRecord>(
              `getUser function: id=${id}`,
              this.initUser()
            )
          )
        );
    }
    return of(this.initUser());
  }

  public throwError<T>(message: string, result: T) {
    return this.handleError<T>(message, result)(message);
  }

  private handleError<T>(message: string, result: T) {
    return (error: any): Observable<T> => {
      console.error(
        `UserService encountered an error: ${message} error: ${error}`
      );
      return of(result as T);
    };
  }
}
