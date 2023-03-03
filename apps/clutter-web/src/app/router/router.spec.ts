// For more examples:
//   https://github.com/angular/angular/blob/master/modules/@angular/router/test/integration.spec.ts

import { Location } from '@angular/common';
import { SpyLocation } from '@angular/common/testing';
import { Type } from '@angular/core';
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
  waitForAsync
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from '../app/app.component';
import { AppModule } from '../app/app.module';
import { declarations } from '../app/declarations';
import { imports } from '../app/imports';
import { TweetFeedComponent } from '../tweet-feed/tweet-feed.component';
import { TweetService } from '../tweet/tweet.service';
import { UserComponent } from '../user/user.component';
import { UserService } from '../user/user.service';
import { AppRoutes } from './routes';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;
let page: Page;
let router: Router;
let location: SpyLocation;
let users: UserService;
let tweets: TweetService;

describe('Router Testing Module:', () => {
  const user1Id = '71ab267fc37caa55b9d8de7280daee18';
  const user2Id = '750891be3ef78dda51ea512d1726348e';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...imports,
        AppModule,
        RouterTestingModule.withRoutes(AppRoutes)
      ],
      declarations: [...declarations, MockTweetFeedComponent],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true },
        { provide: UserService },
        { provide: TweetService }
      ]
    }).compileComponents();
  }));

  it("The App should rediect to an arbitary user's page on loading", (done) => {
    createComponent();
    advance(); // wait for async data to arrive
    page.fixture.whenStable().then(() => {
      expectPathToBe(`/user/${user1Id}`, 'after initialNavigation()');
      expectElementOf(UserComponent);
      done();
    });
  });

  //it("The App should be able to navigate to another user's profile from thier username link", waitForAsync(() => {
  it("The App should be able to navigate to another user's profile from thier username link", (done) => {
    createComponent();
    advance();
    fixture.whenStable().then(() => {
      users = TestBed.inject(UserService);
      tweets = TestBed.inject(TweetService);
      const TweetFeed = TestBed.createComponent(MockTweetFeedComponent);
      TweetFeed.detectChanges();
      TweetFeed.whenStable().then(() => {
        const tweetUsers = TweetFeed.debugElement.queryAll(
          By.css('.feed .profile-link')
        );
        const link = tweetUsers[1].nativeElement;
        link.click();
        advance();
        fixture.whenStable().then(() => {
          expectPathToBe(`/user/${user2Id}`);
          expectElementOf(UserComponent);
          done();
        });
      });
    });
  });

  //  it("The App should be to add a new tweet utilizing the user id in the url", waitForAsync(() => {
  it('The App should be to add a new tweet utilizing the user id in the url', (done) => {
    createComponent();
    advance();
    fixture.whenStable().then(() => {
      users = TestBed.inject(UserService);
      tweets = TestBed.inject(TweetService);
      const TweetFeed = TestBed.createComponent(TweetFeedComponent);
      TweetFeed.detectChanges();
      TweetFeed.whenStable().then(() => {
        //Open the Drawer
        const debug = TweetFeed.debugElement;
        const instance = TweetFeed.componentInstance;
        const linkDes = debug.query(By.css('.feed-header .button'));
        linkDes.triggerEventHandler('click', null);
        TweetFeed.detectChanges();

        TweetFeed.whenStable().then(() => {
          const newTweetText = 'New Tweet! 123';
          const drawerClosed = debug.query(By.css('.display-none'));
          expect(drawerClosed).toBeNull();

          //Add some text to the compose tweet text area
          const textBox = debug.query(By.css('#new-tweet'));
          textBox.nativeElement.value = newTweetText;
          textBox.nativeElement.innerHTML = newTweetText;
          textBox.nativeElement.dispatchEvent(new Event('input'));
          TweetFeed.detectChanges();

          //Click the submit button
          const submit = debug.query(By.css('#submit-tweet'));
          submit.nativeElement.dispatchEvent(new Event('click'));
          TweetFeed.detectChanges();
          TweetFeed.whenStable().then(() => {
            const tweetFeed = debug.queryAll(By.css('.feed .tweet-text'));
            const tweetsArray = instance.tweets;
            expect(
              tweetsArray.findIndex((e) => e.tweetText === newTweetText)
            ).toBeGreaterThan(-1);
            expect(tweetFeed[0].nativeElement.innerHTML).toContain(
              newTweetText
            );
            expect(tweetsArray[0].tweetText).toContain(newTweetText);
            done();
          });
        });
      });
    });
  });
});

////// Helpers /////////

/**
 * Advance to the routed page
 * Wait a tick, then detect changes, and tick again
 */
function advance(): void {
  fixture.detectChanges(); // update view
}

function createComponent() {
  fixture = TestBed.createComponent(AppComponent);
  comp = fixture.componentInstance;

  const injector = fixture.debugElement.injector;
  location = injector.get(Location) as SpyLocation;
  router = injector.get(Router);
  users = injector.get(UserService);
  tweets = injector.get(TweetService);
  router.initialNavigation();
  advance();

  page = new Page();
}

class Page {
  // for debugging
  comp: AppComponent;
  router: Router;
  fixture: ComponentFixture<AppComponent>;

  constructor() {
    // for debugging
    this.comp = comp;
    this.fixture = fixture;
    this.router = router;
  }
}

function expectPathToBe(path: string, expectationFailOutput?: any) {
  expect(location.path())
    .withContext(expectationFailOutput || 'location.path()')
    .toEqual(path);
}

function expectElementOf(type: Type<any>): any {
  const el = fixture.debugElement.query(By.directive(type));
  expect(el).withContext(`expected an element for ${type.name}`).toBeTruthy();
  return el;
}

class MockTweetFeedComponent extends TweetFeedComponent {
  getTweets(): void {
    super.filterTweets(this.getId());
  }

  add(tweetText: string): void {
    super.add(tweetText, this.getId());
  }

  getId(): string {
    const path = location.path().split('/');
    const id: string =
      Array.isArray(path) && path?.[2]
        ? path[2]
        : '71ab267fc37caa55b9d8de7280daee18';
    return id;
  }
}
