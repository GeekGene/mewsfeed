import { Component } from '@angular/core';
import { tweetMock} from './tweet-mock';
@Component({
  selector: 'tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  // inspired by: https://devdactic.com/twitter-ui-with-ionic
  tweets: any =  tweetMock;
  segment = 'home';
  opts = {
    slidesPerView: 4.5,
    spaceBetween: 10,
    slidesOffsetBefore: 0
  };
  constructor() {}

}
