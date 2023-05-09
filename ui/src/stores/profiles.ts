import {
  Profile,
  ProfilesClient,
  ProfilesConfig,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import { useQuasar } from "quasar";
import { ref, onUnmounted } from "vue";
import CreateProfileDialog from "../components/CreateProfileDialog.vue";
import { AppAgentWebsocket } from "@holochain/client";
import { NATIVE_HC_URI, NATIVE_INSTALLED_APP_ID } from "./client";
import { PROFILE_FIELDS } from "@/types/types";
import asyncRetry from "async-retry";

const config: ProfilesConfig = {
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

export const useProfilesStore = () => {
  const profilesStore = ref<ProfilesStore>();
  const myProfile = ref<Profile>();
  const $q = useQuasar();

  const setup = async () => {
    const appAgentClient = await AppAgentWebsocket.connect(
      NATIVE_HC_URI,
      NATIVE_INSTALLED_APP_ID,
      25000
    );

    await appAgentClient.appInfo();

    profilesStore.value = new ProfilesStore(
      new ProfilesClient(appAgentClient, "mewsfeed", "profiles"),
      config
    );

    if (profilesStore.value) {
      profilesStore.value.myProfile.subscribe((res: any) => {
        if (res.status === "complete" && res.value !== undefined) {
          myProfile.value = res.value;
        }
      });
    }
  };

  asyncRetry(setup);

  const runWhenMyProfileExists = (fn: () => void) => {
    if (!myProfile.value) {
      $q.dialog({
        component: CreateProfileDialog,
      }).onOk((profile: Profile) => {
        myProfile.value = profile;
        fn();
      });
      return;
    } else {
      fn();
    }
  };

  const searchProfiles = (
    input: string
  ): Promise<Array<[Uint8Array, Profile]>> =>
    new Promise((resolve, reject) => {
      profilesStore.value?.searchProfiles(input).subscribe((res: any) => {
        if (res.status === "complete") {
          resolve(Array.from(res.value.entries()));
        } else if (res.status === "error") reject(res);
      });
    });

  return {
    profilesStore,
    runWhenMyProfileExists,
    myProfile,
    searchProfiles,
  };
};
