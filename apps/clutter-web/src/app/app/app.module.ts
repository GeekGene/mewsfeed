import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { declarations } from './declarations';
import { imports } from './imports';

@NgModule({
  declarations: [...declarations],
  imports: [...imports],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
