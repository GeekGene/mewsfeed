import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import followers from '../../assets/data/mock-followers.json';
import { TweetRecord, TweetSchema } from '../model/Tweet';
import { UserRecord } from '../model/User';
import { TweetService } from '../tweet/tweet.service';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-tweet-feed',
  templateUrl: './tweet-feed.component.html',
  styleUrls: ['./tweet-feed.component.scss'],
  animations: [
    trigger('openClose', [
      // ...
      state(
        'open',
        style({
          opacity: 1
        })
      ),
      state(
        'closed',
        style({
          opacity: 0
        })
      ),
      transition('open => closed', [animate('2s')]),
      transition('closed => open', [animate('1s')])
    ])
  ]
})
export class TweetFeedComponent implements OnInit, OnDestroy {
  tweets: TweetRecord[] = [];
  isOpen = false;
  hide = true;
  user: UserRecord;
  newTweet: TweetRecord;
  navigationSubscription: any;

  constructor(
    public tweetService: TweetService,
    public userService: UserService,
    public route: ActivatedRoute,
    public router: Router
  ) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      // If it is a NavigationEnd event re-initalise the component
      if (e instanceof NavigationEnd) {
        this.initNewTweet();
        this.getTweets();
        this.getUser();
      }
    });
  }

  ngOnInit(): void {
    this.initNewTweet();
    this.getUser();
    this.getTweets();
  }

  initNewTweet(data?: Partial<TweetSchema>): void {
    this.newTweet = data ? new TweetRecord(data) : new TweetRecord();
  }

  getTweets(): void {
    const id: string = this.route.snapshot.paramMap.get('id');
    this.filterTweets(id);
  }

  filterTweets(id: string): void {
    this.tweetService.getTweets().subscribe((tweets: TweetRecord[]) => {
      const followed: string[] = this.getUsersFollowed(id);
      followed.push(id);
      this.tweets = tweets
        .filter((tweet: TweetRecord) => followed.indexOf(tweet.userId) !== -1)
        .slice(0, 20)
        .sort((a, b) => {
          if (a.created < b.created) {
            return 1;
          }
          if (a.created > b.created) {
            return -1;
          }
          return 0;
        });
    });
  }

  getUsersFollowed(userId: string): string[] {
    return followers.filter((f) => userId === f.userId).map((f) => f.targetId);
  }

  getUser(): void {
    const idKey = this.route.snapshot.paramMap.get('id');
    this.userService.getUser(idKey).subscribe((user) => {
      this.user = user;
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.hide = !this.hide;
  }

  //add(tweetText: string, id?: string)
  add(tweetText: string, id?: string) {
    const userId: string = id !== undefined ? id : this.user.id;
    this.initNewTweet({ userId, tweetText });
    this.tweetService
      .addTweet(this.newTweet)
      .subscribe((tweet) => this.tweets.unshift(tweet));
  }

  ngOnDestroy(): void {
    // avoid memory leaks here by cleaning up after ourselves. If we
    // don't then we will continue to run our initialiseInvites()
    // method on every navigationEnd event.
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  /**
   * Todo: Implement later
   */
  // delete(tweet: Tweet): void {
  //   this.tweets = this.tweets.filter(t => t !== tweet);
  //   this.tweetService.deleteTweet(tweet).subscribe();
  // }
}
