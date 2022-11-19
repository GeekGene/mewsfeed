import { Injectable } from '@angular/core';
import { useSignalStore, presentHcSignal } from './holochain.functions';
import { AppWebsocket, InstalledAppInfo } from '@holochain/client';
import { BehaviorSubject, Observable } from 'rxjs';

const HC_APP_TIMEOUT = 10_000;

@Injectable({
  providedIn: 'root',
})
export class HolochainService {
  public connected$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public connected$: Observable<boolean> = this.connected$$.asObservable();
  // path to your local hc app websocket
  // find the correct port in the log: App port attached at xxx
  private appWsUrl = 'ws://localhost:35441';
  private installedAppId = 'clutter';
  // see: https://github.com/artbrock/clutter/blob/develop/ui/src/stores/index.ts
  //
  private client: AppWebsocket;
  private appInfo: InstalledAppInfo;

  async connect(): Promise<void> {
    console.log('🚀 ~ HolochainService ~ connect');
    const holochainClient = await AppWebsocket.connect(
      this.appWsUrl,
      HC_APP_TIMEOUT,
      (signal) => useSignalStore().handleSignal(presentHcSignal(signal))
    );

    this.client = holochainClient;
    console.log('🚀 ~ HolochainService ~ connected ~ ', holochainClient);
  }

  async loadAppInfo(): Promise<void> {
    console.log(
      '🚀 ~ HolochainService ~ loadAppInfo ~ start',
      this.installedAppId
    );
    try {
      const appInfo = await this.client.appInfo({
        installed_app_id: this.installedAppId,
      });
      this.appInfo = appInfo;
      this.connected$$.next(true);
      console.log('🚀 ~ HolochainService ~ loaded AppInfo ~', appInfo);
    } catch (error) {
      console.error('appInfo() returned error.', error); // inspect(error)
    }
  }

  async initialize(): Promise<void> {
    await this.connect();
    await this.loadAppInfo();
  }

  public async callZome({ roleId, zomeName, fnName, payload = null }) {
    if (!this.appInfo) {
      throw new Error('Tried to make a zome call before storing appInfo');
    }

    const cellDatum = this.appInfo.cell_data.find((c) => c.role_id === roleId);

    if (!cellDatum) {
      throw new Error(`Couldn't find cell with role_id ${roleId}`);
    }

    const { cell_id } = cellDatum;

    // useIsLoadingStore().callIsLoading({ zomeName, fnName });

    const params = {
      cap_secret: null,
      cell_id,
      zome_name: zomeName,
      fn_name: fnName,
      payload,
      provenance: cell_id[1],
    };
    console.log('🚀 ~ HolochainService ~ callZome ~ ', params);

    try {
      const result = await this.client.callZome(params, HC_APP_TIMEOUT);

      return result;
    } finally {
      // useIsLoadingStore().callIsNotLoading({ zomeName, fnName });
    }
  }
}
