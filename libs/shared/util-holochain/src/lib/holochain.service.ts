import { Inject, Injectable } from '@angular/core';
// import { useSignalStore, presentHcSignal } from './holochain.functions';
// https://github.com/mattyg/herddit/blob/main/ui/src/App.vue
// https://github.com/holochain/holochain-client-js/blob/main/src/api/app-agent/websocket.ts
// AppAgentWebsocket
import { AdminWebsocket, AppWebsocket, AppInfo, CellType, encodeHashToBase64, SigningCredentials, generateSigningKeyPair, GrantedFunctionsType, setSigningCredentials } from '@holochain/client';
import { BehaviorSubject, Observable } from 'rxjs';

interface SigningCredentialsJson
  extends Omit<SigningCredentials, "capSecret" | "keyPair" | "signingKey"> {
  capSecret: number[];
  keyPair: {
    publicKey: number[];
    secretKey: number[];
  };
  signingKey: number[];
}

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
  private appInfo: AppInfo;

  constructor(
    @Inject('HOLOCHAIN_WS_APP_URL') public holochainWsAppUrl: string,
    @Inject('HOLOCHAIN_WS_ADMIN_URL') public holochainWsAdminUrl: string,
    @Inject('HOLOCHAIN_APP_ID') public holochainAppId: string,
    @Inject('HOLOCHAIN_TIMEOUT_MS') public holochainTimeoutMs: number
  ) { }

  async connect(): Promise<void> {
    console.log('🚀 ~ HolochainService ~ connect');
    const holochainClient = await AppWebsocket.connect(
      this.holochainWsAppUrl,
      this.holochainTimeoutMs,
      // (signal) => useSignalStore().handleSignal(presentHcSignal(signal))
    );
    holochainClient.client.socket.onclose = (e) => {
      console.log('🚀 ~ HolochainService ~ Socket closed.', e)
      this.client = null;
    }
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
      console.log('🚀 ~ HolochainService ~ loadedAppInfo ~', appInfo);
    } catch (error) {
      console.error('appInfo() returned error.', error); // inspect(error)
    }
  }

  async initialize(roleName: string): Promise<void> {
    console.log('🚀 ~ HolochainService ~ initialize ~ ', {
      holochainWsAppUrl: this.holochainWsAppUrl,
      holochainWsAdminUrl: this.holochainWsAdminUrl,
      holochainAppId: this.holochainAppId,
      holochainTimeoutMs: this.holochainTimeoutMs,
      roleName
    });
    await this.connect();
    await this.loadAppInfo();
    await this.sign(roleName);
    this.connected$$.next(true);
  }

  async sign(roleName: string): Promise<void> {
    console.log('🚀 ~ HolochainService ~ sign ~ roleName:', roleName);
    if (!(CellType.Provisioned in this.appInfo.cell_info[roleName][0])) {
      throw new Error('Could not find cell "clutter"');
    }

    // set up zome call signing when run outside of launcher
    // see https://github.com/holochain/holochain-client-js   
    const __HC_LAUNCHER_ENV__ = "__HC_LAUNCHER_ENV__";
    if (typeof window === "object" && !(__HC_LAUNCHER_ENV__ in window)) {
      const { cell_id } =
        this.appInfo.cell_info[roleName][0][CellType.Provisioned];

      const cellIdB64 =
        encodeHashToBase64(cell_id[0]) + encodeHashToBase64(cell_id[1]);
      const storedSigningCredentials = localStorage.getItem(cellIdB64);
      let signingCredentialsJson: SigningCredentialsJson | null =
        storedSigningCredentials && JSON.parse(storedSigningCredentials);
      let signingCredentials: SigningCredentials | null =
        signingCredentialsJson && {
          capSecret: Uint8Array.from(signingCredentialsJson.capSecret),
          keyPair: {
            publicKey: Uint8Array.from(signingCredentialsJson.keyPair.publicKey),
            secretKey: Uint8Array.from(signingCredentialsJson.keyPair.secretKey),
          },
          signingKey: Uint8Array.from(signingCredentialsJson.signingKey),
        };

      if (!signingCredentials) {
        localStorage.clear();
        const [keyPair, signingKey] = generateSigningKeyPair();
        const adminWs = await AdminWebsocket.connect(
          this.holochainWsAdminUrl
        );
        const capSecret = await adminWs.grantSigningKey(
          cell_id,
          { [GrantedFunctionsType.All]: null },
          signingKey
        );
        signingCredentials = {
          capSecret,
          keyPair,
          signingKey,
        };
        signingCredentialsJson = {
          capSecret: Array.from(capSecret),
          keyPair: {
            publicKey: Array.from(keyPair.publicKey),
            secretKey: Array.from(keyPair.secretKey),
          },
          signingKey: Array.from(signingKey),
        };
      }
      setSigningCredentials(cell_id, signingCredentials);
      localStorage.setItem(cellIdB64, JSON.stringify(signingCredentialsJson));
      console.log('🚀 ~ HolochainService ~ sign ~ done:', roleName);
    }
  }

  // TODO: When holo host is ready for use, their client will be fully compatible with AppAgentClient 
  // https://github.com/holochain/holochain-client-js/blob/a435f9edd7fa4f837faebdd3cd2abf0c080404ce/src/api/app-agent/types.ts#L79
  public async callZome({ roleName, zomeName, fnName, payload = null }) {
    if (!this.appInfo) {
      throw new Error('Tried to make a zome call before storing appInfo');
    }

    const cellDatum = this.appInfo.cell_info[roleName][0][CellType.Provisioned]

    if (!cellDatum) {
      throw new Error(`Couldn't find cell with role_id ${roleName}`);
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
