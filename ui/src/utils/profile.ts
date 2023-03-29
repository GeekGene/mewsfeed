import { ROUTES } from "@/router";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { useRoute, useRouter } from "vue-router";
import { onUnmounted, ref } from "vue";
import { useProfilesStore } from "@/services/profiles-store";
import { Profile } from "@holochain-open-dev/profiles";
import { useQuasar } from "quasar";
import CreateProfileDialog from "@/components/CreateProfileDialog.vue";

export const useProfileUtils = () => {
  const route = useRoute();
  const router = useRouter();

  const isCurrentProfile = (agentPubKey: AgentPubKey) =>
    route.params.agent === encodeHashToBase64(agentPubKey);

  const onAgentClick = (agentPubKey: AgentPubKey) => {
    if (!isCurrentProfile(agentPubKey)) {
      router.push({
        name: ROUTES.profiles,
        params: { agent: encodeHashToBase64(agentPubKey) },
      });
    }
  };

  return { isCurrentProfile, onAgentClick };
};

export const useMyProfile = () => {
  const profilesStore = useProfilesStore();
  const $q = useQuasar();

  const myProfile = ref<undefined | Profile>(undefined);

  const unsubscribe = profilesStore.value.myProfile.subscribe((res: any) => {
    myProfile.value = res.value;
  });
  onUnmounted(unsubscribe);

  const runWhenMyProfileExists = (fn: () => void) => {
    if (!myProfile.value) {
      $q.dialog({
        component: CreateProfileDialog,
      }).onOk((profile) => {
        myProfile.value = profile;
        fn();
      });
      return;
    } else {
      fn();
    }
  };

  return { myProfile, runWhenMyProfileExists };
};

export const useSearchProfiles = () => {
  const profilesStore = useProfilesStore();

  const searchProfiles = (
    input: string
  ): Promise<Array<[Uint8Array, Profile]>> =>
    new Promise((resolve, reject) => {
      profilesStore.value.searchProfiles(input).subscribe((res: any) => {
        if (res.status === "complete") {
          resolve(Array.from(res.value.entries()));
        } else if (res.status === "error") reject(res);
      });
    });

  return { searchProfiles };
};
