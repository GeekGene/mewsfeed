import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { generateReadableTimestamp } from '@shared/util-common'
import { UserRecord } from '../model/User';
import { FeedMew } from '@clutter/data-access-dna';

@Component({
  selector: 'app-tweet',
  templateUrl: './tweet.component.html',
  styleUrls: ['./tweet.component.scss']
})
export class TweetComponent implements OnInit, OnChanges {
  @Input() feedMew: FeedMew;
  user: UserRecord = new UserRecord();
  timestamp: string;

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
