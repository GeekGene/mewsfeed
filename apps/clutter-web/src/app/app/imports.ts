import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MomentModule } from 'ngx-moment';

import { InMemoryService } from '../in-memory-data.service';
import { AppRoutingModule } from '../router/routing.module';

const imports = [
  BrowserModule,
  AppRoutingModule,
  HttpClientModule,
  InMemoryService,
  MomentModule.forRoot({
    relativeTimeThresholdOptions: {
      m: 59
    }
  }),
  BrowserAnimationsModule,
  CommonModule
];

export { imports };
