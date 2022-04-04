import { ProfilesStore } from "@holochain-open-dev/profiles";
import { inject, InjectionKey } from "vue";

export const PROFILE_STORE: InjectionKey<ProfilesStore> = Symbol();
export const useProfileStore = () => {
  const profileStore = inject(PROFILE_STORE);
  if (!profileStore) {
    throw new Error("Profile store has not been provided");
  }
  return profileStore;
};
