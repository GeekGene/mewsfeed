import { Component } from '@angular/core';
import { HolochainService } from '@shared/util-holochain';

@Component({
  selector: 'root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  connected$ = this.holochainService.connected$;

  constructor(private holochainService: HolochainService) {
    this.holochainService.initialize();
  }

}
