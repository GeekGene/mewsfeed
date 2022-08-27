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
import { isSameAgentPubKey } from "@/utils/hash";
import { showError, showMessage } from "@/utils/notification";
import { Profile } from "@holochain-open-dev/profiles";
import { AgentPubKey } from "@holochain/client";
import { onMounted, PropType, ref } from "vue";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const profilesStore = useProfilesStore();

const loading = ref(false);
const following = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const currentMyFollowing = await myFollowing();
    following.value = currentMyFollowing.some((agent) =>
      isSameAgentPubKey(agent, props.agentPubKey)
    );
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});

const toggleFollow = async () => {
  try {
    const [profileReadable] = await Promise.all([
      profilesStore.value.fetchAgentProfile(props.agentPubKey),
      following.value
        ? await unfollow(props.agentPubKey)
        : await follow(props.agentPubKey),
    ]);
    let profile: Profile | undefined;
    profileReadable.subscribe((p) => (profile = p));
    following.value = !following.value;
    const name = `${profile?.fields["Display name"]} (@${profile?.nickname})`;
    const message = following.value
      ? `You're following ${name} now`
      : `You're not following ${name} anymore`;
    showMessage(message);
  } catch (error) {
    showError(error);
  }
};
</script>
