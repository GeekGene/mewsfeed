import { ProfilesStore } from "@holochain-open-dev/profiles-dev/ui";
import { inject, InjectionKey, Ref } from "vue";

export const PROFILES_STORE: InjectionKey<Ref<ProfilesStore>> = Symbol();
export const useProfilesStore = () => {
  const profilesStore = inject(PROFILES_STORE);
  if (!profilesStore) {
    throw new Error("Profile store has not been provided");
  }
  return profilesStore;
};
