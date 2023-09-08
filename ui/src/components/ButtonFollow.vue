<template>
  <button
    class="btn btn-sm rounded-3xl px-4"
    :class="{
      'btn-primary': isFollowing,
      'btn-neutral': !isFollowing,
      'md:btn-md': big,
    }"
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
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { computed, ComputedRef, inject, ref, watch } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { AppAgentClient } from "@holochain/client";
import CreateProfileIfNotFoundDialog from "./CreateProfileIfNotFoundDialog.vue";
import isEqual from "lodash/isEqual";
import { setHomeRedirect } from "@/utils/homeRedirect";
import { useQuery } from "@tanstack/vue-query";
import { useToasts } from "@/stores/toasts";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    big?: boolean;
  }>(),
  {
    big: true,
  }
);
const emit = defineEmits(["toggle-follow"]);
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const { showMessage, showError } = useToasts();

const showCreateProfileDialog = ref(false);

const fetchMyFollowing = async (): Promise<AgentPubKey[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "follows",
    fn_name: "get_creators_for_follower",
    payload: {
      follower: client.myPubKey,
    },
  });

const isFollowing = computed(() => {
  if (!currentMyFollowing.value) return false;

  return currentMyFollowing.value.some((agent: AgentPubKey) =>
    isEqual(agent, props.agentPubKey)
  );
});

const {
  data: currentMyFollowing,
  error: errorMyFollowing,
  refetch: refetchMyFollowing,
} = useQuery({
  queryKey: [
    "follows",
    "get_creators_for_follower",
    encodeHashToBase64(client.myPubKey),
    "isFollowing",
  ],
  queryFn: fetchMyFollowing,
});
watch(errorMyFollowing, console.error);
watch(props, () => {
  refetchMyFollowing();
});

const toggleFollow = async () => {
  if (!myProfile.value) {
    showCreateProfileDialog.value = true;
    return;
  }
  showCreateProfileDialog.value = false;

  try {
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
        });
    await refetchMyFollowing();
    if (isFollowing.value) {
      setHomeRedirect(false);
    }
    emit("toggle-follow", isFollowing.value);
    showSuccessMessage();
  } catch (error) {
    showError(error);
  }
};

const showSuccessMessage = async () => {
  let name;
  try {
    const profile = await profilesStore.client.getAgentProfile(
      props.agentPubKey
    );
    name = `${profile?.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
      profile?.nickname
    })`;
  } catch (error) {
    console.error(error);
    name = encodeHashToBase64(props.agentPubKey);
  }

  const message = isFollowing.value ? `Followed ${name}` : `Unfollowed ${name}`;
  showMessage(message);
};
</script>
