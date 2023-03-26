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
import { Profile } from "@holochain-open-dev/profiles";
import { AgentPubKey } from "@holochain/client";
import { useQuasar } from "quasar";
import { onMounted, onUnmounted, PropType, ref } from "vue";
import CreateProfileDialog from "../components/CreateProfileDialog.vue";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const profilesStore = useProfilesStore();
const $q = useQuasar();

const loading = ref(false);
const following = ref(false);

const myProfile = ref<Profile>();
const unsubscribe = profilesStore.value.myProfile.subscribe((res: any) => {
  myProfile.value = res.value;
});
onUnmounted(unsubscribe);

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

const toggleFollow = async () => {
  // Prompt user to create profile if they don't have one
  if (!myProfile.value) {
    $q.dialog({
      component: CreateProfileDialog,
    }).onOk((profile) => {
      myProfile.value = profile;
      toggleFollow();
    });
    return;
  }

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
};
</script>
