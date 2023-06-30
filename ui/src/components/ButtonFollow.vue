<template>
  <button
    class="btn btn-sm rounded-3xl px-4"
    :class="{ 'btn-primary': isFollowing, 'btn-neutral': !isFollowing }"
    @click.stop.prevent="toggleFollow"
  >
    {{ isFollowing ? "Following" : "Follow" }}
  </button>
  <CreateProfileIfNotFoundDialog
    v-model="showCreateProfileDialog"
    @profile-created="toggleFollow()"
  />
</template>

<script setup lang="ts">
import { PROFILE_FIELDS } from "@/types/types";
import { showError, showMessage } from "@/utils/toasts";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, inject, PropType, ref, watch } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { AppAgentClient } from "@holochain/client";
import CreateProfileIfNotFoundDialog from "./CreateProfileIfNotFoundDialog.vue";
import isEqual from "lodash/isEqual";
import { setHomeRedirect } from "@/utils/homeRedirect";
import { useQuery } from "@tanstack/vue-query";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});
const emit = defineEmits(["toggle-follow"]);
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;

const showCreateProfileDialog = ref(false);

const fetchIsFollowing = async () => {
  const currentMyFollowing: AgentPubKey[] = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_creators_for_follower",
    payload: {
      follower: client.myPubKey,
    },
  });

  return currentMyFollowing.some((agent) => isEqual(agent, props.agentPubKey));
};

const {
  data: isFollowing,
  error: errorIsFollowing,
  refetch: refetchIsFollowing,
} = useQuery({
  queryKey: [
    "follows",
    "get_creators_for_follower",
    encodeHashToBase64(client.myPubKey),
    "isFollowing",
  ],
  queryFn: fetchIsFollowing,
});
watch(errorIsFollowing, showError);

const toggleFollow = async () => {
  if (!myProfile.value) {
    showCreateProfileDialog.value = true;
    return;
  }
  showCreateProfileDialog.value = false;

  try {
    const [profile] = await Promise.all([
      profilesStore.client.getAgentProfile(props.agentPubKey),
      isFollowing.value
        ? await client.callZome({
            role_name: "mewsfeed",
            zome_name: "follows",
            fn_name: "unfollow",
            payload: props.agentPubKey,
          })
        : await client.callZome({
            role_name: "mewsfeed",
            zome_name: "follows",
            fn_name: "follow",
            payload: props.agentPubKey,
          }),
    ]);
    refetchIsFollowing();
    if (isFollowing.value) {
      setHomeRedirect(false);
    }

    const name = `${profile?.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
      profile?.nickname
    })`;
    const message = isFollowing.value
      ? `You're following ${name} now`
      : `You're not following ${name} anymore`;
    showMessage(message);
    emit("toggle-follow", isFollowing.value);
  } catch (error) {
    showError(error);
  }
};
</script>
