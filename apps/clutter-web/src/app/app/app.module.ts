import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { declarations } from './declarations';
import { imports } from './imports';

@NgModule({
  declarations: [...declarations],
  imports: [...imports],
  providers: [
    // path to your local hc app websocket
    // find the correct port in the log: App port and admin attached
    { provide: 'HOLOCHAIN_WS_APP_URL', useValue: 'ws://localhost:' + process.env['NX_HC_PORT'] },
    { provide: 'HOLOCHAIN_WS_ADMIN_URL', useValue: 'ws://localhost:' + process.env['NX_HC_ADMIN_PORT'] },
    // name of your holochain dna app
    // see: https://github.com/artbrock/clutter/blob/develop/ui/src/stores/index.ts
    { provide: 'HOLOCHAIN_APP_ID', useValue: 'clutter' },
    // holochain timeout in milliseconds
    { provide: 'HOLOCHAIN_TIMEOUT_MS', useValue: 10_000 },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
