import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TweetComponent } from './tweet.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [TweetComponent],
  exports: [TweetComponent],
})
export class TweetComponentModule {}
