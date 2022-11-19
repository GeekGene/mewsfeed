import { from, tap } from 'rxjs';

export const presentHcSignal = (hcSignal) => {
  console.log('🚀 ~ presentHcSignal ~ hcSignal', hcSignal);
  return {
    cell: {
      cell_id: hcSignal.data.cellId,
      role_id: 'unknown',
    },
    data: hcSignal.data.payload,
  };
};

export const useSignalStore = () => {
  console.log('🚀 ~ useSignalStore ~ useSignalStore');

  return {
    handleSignal: (hcSignal) => {
      console.log('🚀 ~ useSignalStore ~ hcSignal', hcSignal);
    },
  };
};

export const zomeCall = <T>(call: Promise<T>, then: (res: T) => void) => {
  from(call)
    .pipe(
      tap((res) => {
        then(res);
      })
    )
    .subscribe();
};
