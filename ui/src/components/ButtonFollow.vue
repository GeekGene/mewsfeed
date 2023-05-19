<template>
  <QBtn size="md" color="secondary" @click.stop.prevent="toggleFollow">
    <template v-if="isFollowing">
      <div class="q-mr-sm">Unfollow</div>
      <QIcon name="svguse:/icons.svg#cat" />
    </template>
    <template v-else>
      <div class="q-mr-sm">Follow</div>
      <QIcon
        name="svguse:/icons.svg#cat"
        color="secondary"
        style="stroke: white"
      />
    </template>
  </QBtn>
  <CreateProfileIfNotFoundDialog
    v-model="showCreateProfileDialog"
    @profile-created="toggleFollow"
  />
</template>

<script setup lang="ts">
import { PROFILE_FIELDS } from "@/types/types";
import { showError, showMessage } from "@/utils/notification";
import { AgentPubKey } from "@holochain/client";
import { ComputedRef, inject, onMounted, PropType, ref } from "vue";
import { QBtn, QIcon } from "quasar";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { AppAgentClient } from "@holochain/client";
import CreateProfileIfNotFoundDialog from "./CreateProfileIfNotFoundDialog.vue";
import isEqual from "lodash/isEqual";

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

const loading = ref(true);
const isFollowing = ref(false);
const showCreateProfileDialog = ref(false);

onMounted(async () => {
  try {
    const currentMyFollowing: AgentPubKey[] = await client.callZome({
      role_name: "mewsfeed",
      zome_name: "follows",
      fn_name: "get_creators_for_follower",
      payload: client.myPubKey,
    });
    isFollowing.value = currentMyFollowing.some((agent) =>
      isEqual(agent, props.agentPubKey)
    );
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});

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
    isFollowing.value = !isFollowing.value;
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
