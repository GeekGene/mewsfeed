import { TestBed, waitForAsync } from '@angular/core/testing';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { UserComponent } from '../user/user.component';
import { AppComponent } from './app.component';
import { declarations } from './declarations';
import { imports } from './imports';

describe('Component: AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...imports,
        RouterTestingModule.withRoutes([
          {
            path: '',
            redirectTo: '/user/71ab267fc37caa55b9d8de7280daee18',
            pathMatch: 'full'
          },
          {
            path: 'user/:id',
            component: UserComponent,
            runGuardsAndResolvers: 'always'
          }
        ])
      ],
      declarations,
      providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }]
    }).compileComponents();
  }));

  it('The App Component should be initialized', (done) => {
    const url = '/user/71ab267fc37caa55b9d8de7280daee18';
    const router = TestBed.inject(Router);
    router.initialNavigation();
    router.setUpLocationChangeListener();
    const p = router.navigateByUrl(url);
    p.then(
      (success) => {
        if (success) {
          const ne = of(new NavigationEnd(0, url, url));
          const fixture = TestBed.createComponent(AppComponent);
          fixture.detectChanges();
          const component = fixture.nativeElement;
          expect(component).toBeDefined();
          done();
        } else {
          expect(false).toBeTrue();
        }
      },
      (error) => {
        console.log(error);
      }
    );
  });

  it('The App Component render a bird icon in the header of the page', (done) => {
    const url = '/user/71ab267fc37caa55b9d8de7280daee18';
    const router = TestBed.inject(Router);
    router.initialNavigation();
    router.setUpLocationChangeListener();
    const p = router.navigateByUrl(url);
    p.then(
      (success) => {
        if (success) {
          const ne = of(new NavigationEnd(0, url, url));
          const fixture = TestBed.createComponent(AppComponent);
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            const component = fixture.nativeElement;
            const icon = component.querySelector('i.fab.fa-twitter');
            expect(icon).toBeDefined();
            done();
          });
        } else {
          expect(false).toBeTrue();
        }
      },
      (error) => {
        console.log(error);
      }
    );
  });
});
