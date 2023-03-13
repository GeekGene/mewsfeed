import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // path to your local hc app websocket
    // find the correct port in the log: App port and admin attached
    { provide: 'HOLOCHAIN_WS_APP_URL', useValue: 'ws://localhost:44399' },
    { provide: 'HOLOCHAIN_WS_ADMIN_URL', useValue: 'ws://localhost:36751' },
    // name of your holochain dna app
    // see: https://github.com/artbrock/clutter/blob/develop/ui/src/stores/index.ts
    { provide: 'HOLOCHAIN_APP_ID', useValue: 'clutter' },
    // holochain timeout in milliseconds
    { provide: 'HOLOCHAIN_TIMEOUT_MS', useValue: 10_000 },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
