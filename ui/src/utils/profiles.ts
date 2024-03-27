import {
  Profile,
  ProfilesConfig,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import { ComputedRef, inject } from "vue";
import { PROFILE_FIELDS } from "@/types/types";
import { EntryRecord } from "@holochain-open-dev/utils";

export const PROFILES_CONFIG: ProfilesConfig = {
  minNicknameLength: 3,
  avatarMode: "avatar-optional",
  additionalFields: [
    {
      name: PROFILE_FIELDS.DISPLAY_NAME,
      label: PROFILE_FIELDS.DISPLAY_NAME,
      required: false,
    },
    {
      name: PROFILE_FIELDS.BIO,
      label: PROFILE_FIELDS.BIO,
      required: false,
    },
    {
      name: PROFILE_FIELDS.LOCATION,
      label: PROFILE_FIELDS.LOCATION,
      required: false,
    },
  ],
};

export const useSearchProfiles = () => {
  const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
    .value;

  const searchProfiles = (
    input: string
  ): Promise<Array<[Uint8Array, EntryRecord<Profile>]>> =>
    new Promise((resolve, reject) => {
      profilesStore.searchProfiles(input).subscribe((res) => {
        if (res.status === "complete") {
          resolve(Array.from(res.value.entries()));
        } else if (res.status === "error") reject(res);
      });
    });

  return searchProfiles;
};
