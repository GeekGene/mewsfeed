import { Component, OnInit, Input, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { FeedMew } from '@clutter/data-access-dna';
import { generateReadableTimestamp } from '@shared/util-common'

@Component({
  selector: 'app-tweet',
  templateUrl: './tweet.component.html',
  styleUrls: ['./tweet.component.scss'],
   encapsulation: ViewEncapsulation.None
})
export class TweetComponent implements OnInit {
  @Input() feedMew: FeedMew;
  timestamp: string;

  constructor() { }

  ngOnInit() {
    console.log('one feedMew: ', this.feedMew);
    this.parseTweet();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.timestamp = generateReadableTimestamp(this.feedMew.action.timestamp);
  }

  parseTweet() {
    // this.tweet.text = this.tweet.text.replace(/#[a-zA-Z]+/g,"<span class='highlight'>$&</span>");
    // this.tweet.text = this.tweet.text.replace(/@[a-zA-Z]+/g,"<span class='highlight>$&</span>");
  }

}
