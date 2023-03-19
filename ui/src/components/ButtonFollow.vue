<template>
  <q-btn size="md" color="secondary" @click="toggleFollow">
    <template v-if="isFollowing">
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
import { follow, following, unfollow } from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { FollowInput, FollowTopicInput, PROFILE_FIELDS } from "@/types/types";
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
      let followInput: FollowInput;
      let profile;
      if (following.value) {
        // unfollow:
        [profile] = await Promise.all([
          profilesStore.value.client.getAgentProfile(props.agentPubKey),
          await unfollow(props.agentPubKey),
        ]);
      } else {
        // follow:
        const topics: FollowTopicInput[] = [
          // TODO make these dynamic -- from trust atom vue compoment
          { topic: "food", weight: "1.0" },
          { topic: "forest", weight: "0.2" },
        ];
        followInput = {
          agent: props.agentPubKey,
          followTopics: topics,
          followOther: false,
        };
        [profile] = await Promise.all([
          profilesStore.value.client.getAgentProfile(props.agentPubKey),
          await follow(followInput),
        ]);
      }
      following.value = !following.value;
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
