import { Injectable } from '@angular/core';
import {
  HttpClientInMemoryWebApiModule,
  InMemoryDbService
} from 'angular-in-memory-web-api';

import followers from '../assets/data/mock-followers.json';
import tweets from '../assets/data/mock-tweets.json';
import users from '../assets/data/mock-users.json';

@Injectable({
  providedIn: 'root'
})
class InMemoryDataService implements InMemoryDbService {
  private db: object;

  constructor() {
    this.db = { users, tweets, followers };
  }

  createDb() {
    return this.db;
  }

  // Overrides the genId method to ensure that a hero always has an id.
  // If the heroes array is empty,
  // the method below returns the initial number (11).
  // if the heroes array is not empty, the method below returns the highest
  // hero id + 1.
  // genId(heroes: Hero[]): number {
  //   return heroes.length > 0 ? Math.max(...heroes.map(hero => hero.id)) + 1 : 11;
  // }
  // Todo: Do I need a get id function?
}

const InMemoryService = HttpClientInMemoryWebApiModule.forRoot(
  InMemoryDataService,
  { dataEncapsulation: false }
);

export { InMemoryService };
