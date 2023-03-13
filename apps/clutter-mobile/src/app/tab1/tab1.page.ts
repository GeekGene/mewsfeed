import { Component, OnInit } from '@angular/core';
import { ClutterDnaService, FeedMew } from '@clutter/data-access-dna';
import { zomeCall } from '@shared/util-holochain';
import { tweetMock} from './tweet-mock';
@Component({
  selector: 'tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  // inspired by: https://devdactic.com/twitter-ui-with-ionic
  tweets: any =  tweetMock;
  feedMews: FeedMew[] = [];
  segment = 'home';
  opts = {
    slidesPerView: 4.5,
    spaceBetween: 10,
    slidesOffsetBefore: 0
  };
  constructor(
    private clutterDnaService: ClutterDnaService,
  ) {}

  ngOnInit(): void {
    this.getMews();
  }

  getMews(): void {
    zomeCall(this.clutterDnaService.mewsFeed({ option: '' }), (res) => {
      this.feedMews = res;
    });
  }

  createMew(text: string, id?: string): void {
    zomeCall(
      this.clutterDnaService.createMew({ mewType: { original: null }, text }),
      (res) => {
        console.log('🚀 ~ clutterDnaService ~ tap ~ createMew', res);
        this.getMews();
      }
    );
  }

}
