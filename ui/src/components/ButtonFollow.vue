<template>
  <q-btn size="md" color="secondary" @click="toggleFollow">
    <template v-if="following">
      <div class="q-mr-sm">Unfollow</div>
      <q-icon name="svguse:/icons.svg#cat" />
    </template>
    <template v-else>
      <div class="q-mr-sm">Follow</div>
      <q-icon
        name="svguse:/icons.svg#cat"
        color="secondary"
        style="stroke: white"
      />
    </template>
  </q-btn>
</template>

<script setup lang="ts">
import { follow, myFollowing, unfollow } from "@/services/clutter-dna";
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

const loading = ref(false);
const following = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const currentMyFollowing = await myFollowing();
    following.value = currentMyFollowing.some((agent) =>
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
        following.value
          ? await unfollow(props.agentPubKey)
          : await follow(props.agentPubKey),
      ]);
      following.value = !following.value;
      const name = `${profile?.fields[PROFILE_FIELDS.DISPLAY_NAME]} (@${
        profile?.nickname
      })`;
      const message = following.value
        ? `You're following ${name} now`
        : `You're not following ${name} anymore`;
      showMessage(message);
    } catch (error) {
      showError(error);
    }
  });
};
</script>
