import { Component, Input, OnInit } from '@angular/core';

import { TweetRecord } from '../model/Tweet';
import { UserRecord } from '../model/User';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-tweet',
  templateUrl: './tweet.component.html',
  styleUrls: ['./tweet.component.scss']
})
export class TweetComponent implements OnInit {
  @Input() tweet: TweetRecord = new TweetRecord();
  user: UserRecord = new UserRecord();
  now: number = Date.now();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.getUser();
  }

  getUser(): void {
    this.userService
      .getUser(this.tweet.userId)
      .subscribe((user) => (this.user = user));
  }
}
