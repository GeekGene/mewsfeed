<template>
  <QBtn size="md" color="secondary" @click="toggleFollow">
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
</template>

<script setup lang="ts">
import { follow, following, unfollow } from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError, showMessage } from "@/utils/notification";
import { useMyProfile } from "@/utils/profile";
import { AgentPubKey } from "@holochain/client";
import { onMounted, PropType, ref } from "vue";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const profilesStore = useProfilesStore();
const { runWhenMyProfileExists } = useMyProfile();

const loading = ref(true);
const isFollowing = ref(false);

onMounted(async () => {
  try {
    const currentMyFollowing = await following(
      profilesStore.value.client.client.myPubKey
    );
    isFollowing.value = currentMyFollowing.some((agent) =>
      isSameHash(agent, props.agentPubKey)
    );
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});

const toggleFollow = () => {
  runWhenMyProfileExists(async () => {
    try {
      const [profile] = await Promise.all([
        profilesStore.value.client.getAgentProfile(props.agentPubKey),
        isFollowing.value
          ? await unfollow(props.agentPubKey)
          : await follow(props.agentPubKey),
      ]);
      isFollowing.value = !isFollowing.value;
      const name = `${profile?.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
        profile?.nickname
      })`;
      const message = isFollowing.value
        ? `You're following ${name} now`
        : `You're not following ${name} anymore`;
      showMessage(message);
    } catch (error) {
      showError(error);
    }
  });
};
</script>
