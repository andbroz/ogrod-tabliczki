import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    });
  });

  it('renders the router outlet inside main', () => {
    const fixture = TestBed.createComponent(App);
    const main = (fixture.nativeElement as HTMLElement).querySelector('main');
    expect(main?.querySelector('router-outlet')).not.toBeNull();
  });

  it('shows the garden page at the root route', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Ogród Tabliczki',
    );
  });

  it('redirects unknown routes to the garden', async () => {
    const harness = await RouterTestingHarness.create('/nie-ma');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Ogród Tabliczki',
    );
  });
});
