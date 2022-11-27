import { Inject, Injectable } from '@angular/core';
import { useSignalStore, presentHcSignal } from './holochain.functions';
import { AppWebsocket, InstalledAppInfo } from '@holochain/client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HolochainService {
  public connected$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public connected$: Observable<boolean> = this.connected$$.asObservable();
  //
  private client: AppWebsocket;
  private appInfo: InstalledAppInfo;

  constructor(
    @Inject('HOLOCHAIN_WS_URL') public holochainWsUrl: string,
    @Inject('HOLOCHAIN_APP_ID') public holochainAppId: string,
    @Inject('HOLOCHAIN_TIMEOUT_MS') public holochainTimeoutMs: number
  ) {}

  async connect(): Promise<void> {
    console.log('🚀 ~ HolochainService ~ connect');
    const holochainClient = await AppWebsocket.connect(
      this.holochainWsUrl,
      this.holochainTimeoutMs,
      (signal) => useSignalStore().handleSignal(presentHcSignal(signal))
    );

    this.client = holochainClient;
    console.log('🚀 ~ HolochainService ~ connected');
  }

  async loadAppInfo(): Promise<void> {
    console.log(
      '🚀 ~ HolochainService ~ loadAppInfo',
      this.holochainAppId
    );
    try {
      const appInfo = await this.client.appInfo({
        installed_app_id: this.holochainAppId,
      });
      this.appInfo = appInfo;
      this.connected$$.next(true);
      console.log('🚀 ~ HolochainService ~ loadedAppInfo ~', appInfo);
    } catch (error) {
      console.error('appInfo() returned error.', error); // inspect(error)
    }
  }

  async initialize(): Promise<void> {
    console.log('🚀 ~ HolochainService ~ initialize ~ ', {
      holochainWsUrl: this.holochainWsUrl,
      holochainAppId: this.holochainAppId,
      holochainTimeoutMs: this.holochainTimeoutMs
    });
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
      const result = await this.client.callZome(
        params,
        this.holochainTimeoutMs
      );

      return result;
    } finally {
      // useIsLoadingStore().callIsNotLoading({ zomeName, fnName });
    }
  }
}
