import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TweetRecord } from '../model/Tweet';

const httpOptions = {
  headers: new HttpHeaders({ 'Content Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class TweetService {
  private tweetUrl = 'api/tweets'; // URL to web api

  constructor(private http: HttpClient) {
    this.getTweets();
  }

  /** GET tweets from the server */
  getTweets(): Observable<TweetRecord[]> {
    return this.http
      .get<TweetRecord[]>(this.tweetUrl)
      .pipe(catchError(this.handleError<TweetRecord[]>('getTweet', [])));
  }

  /**   ** /
  getTweet(id: string): Observable<TweetRecord> {
    const url = `${this.tweetUrl}/${id}`;
    return this.http.get<TweetRecord>(url).pipe(
      catchError(this.handleError<TweetRecord>(`getTweet id=${id}`, new TweetRecord()))
    );
  }
/**   **/

  /** POST: add a new tweet to the server */
  addTweet(tweet: TweetRecord): Observable<TweetRecord> {
    return this.http
      .post<TweetRecord>(this.tweetUrl, tweet, httpOptions)
      .pipe(
        catchError(this.handleError<TweetRecord>('addTweet', new TweetRecord()))
      );
  }

  /**
   *  Interface for the test harness
   */
  public throwError<T>(message: string, result: T) {
    return this.handleError<T>(message, result)(message);
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation   name of the operation that failed
   * @param result   optional value to return as the observable result
   */
  private handleError<T>(message: string, result: T) {
    return (error: any): Observable<T> => {
      console.error(
        `UserService encountered an error: ${message} error: ${error}`
      );
      return of(result as T);
    };
  }
}
