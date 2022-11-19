import { Component, Input, OnInit } from '@angular/core';

import { UserRecord } from '../model/User';
import { FeedMew } from '../types/types';

@Component({
  selector: 'app-tweet',
  templateUrl: './tweet.component.html',
  styleUrls: ['./tweet.component.scss']
})
export class TweetComponent implements OnInit {
  @Input() feedMew: FeedMew;
  user: UserRecord = new UserRecord();
  now: number = Date.now();

  constructor() {}

  ngOnInit() {
    this.getUser();
  }

  getUser(): void {
  }
}
