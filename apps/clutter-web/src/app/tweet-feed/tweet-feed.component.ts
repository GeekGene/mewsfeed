import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import followers from '../../assets/data/mock-followers.json';
import { TweetRecord, TweetSchema } from '../model/Tweet';
import { UserRecord } from '../model/User';
import { ClutterDnaService } from '../holochain/clutter-dna.service';
import { UserService } from '../user/user.service';
import { FeedMew } from '../types/types';
import { zomeCall } from '../holochain/holochain.functions';

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
          opacity: 1,
        })
      ),
      state(
        'closed',
        style({
          opacity: 0,
        })
      ),
      transition('open => closed', [animate('2s')]),
      transition('closed => open', [animate('1s')]),
    ]),
  ],
})
export class TweetFeedComponent implements OnInit, OnDestroy {
  feedMews: FeedMew[] = [];
  isOpen = false;
  hide = true;
  user: UserRecord;
  newTweet: TweetRecord;
  navigationSubscription: any;

  constructor(
    public clutterDnaService: ClutterDnaService,
    public userService: UserService,
    public route: ActivatedRoute,
    public router: Router
  ) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      // If it is a NavigationEnd event re-initalise the component
      if (e instanceof NavigationEnd) {
        this.initNewTweet();
        this.getMews();
        this.getUser();
      }
    });
  }

  ngOnInit(): void {
    this.initNewTweet();
    this.getUser();
    this.getMews();
  }

  initNewTweet(data?: Partial<TweetSchema>): void {
    this.newTweet = data ? new TweetRecord(data) : new TweetRecord();
  }

  getMews(): void {
    zomeCall(this.clutterDnaService.mewsFeed({ option: '' }), (res) => {
      this.feedMews = res;
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

  add(text: string, id?: string): void {
    zomeCall(
      this.clutterDnaService.createMew({ mewType: { original: null }, text }),
      (res) => {
        console.log('🚀 ~ clutterDnaService ~ tap ~ createMew', res);
        this.getMews();
      }
    );
  }

  ngOnDestroy(): void {
    // avoid memory leaks here by cleaning up after ourselves. If we
    // don't then we will continue to run our initialiseInvites()
    // method on every navigationEnd event.
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }
}
