import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { generateReadableTimestamp } from './timestamp.functions'
import { UserRecord } from '../model/User';
import { FeedMew } from '../types/types';

@Component({
  selector: 'app-tweet',
  templateUrl: './tweet.component.html',
  styleUrls: ['./tweet.component.scss']
})
export class TweetComponent implements OnInit, OnChanges {
  @Input() feedMew: FeedMew;
  user: UserRecord = new UserRecord();
  timestamp;

  constructor() {}

  ngOnInit() {
    this.getUser();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.timestamp = generateReadableTimestamp(this.feedMew.action.timestamp);
  }

  getUser(): void {
  }
}
