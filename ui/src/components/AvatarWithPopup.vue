<template>
  <agent-avatar
    :agent-pub-key="authorPubKey(mew.header.author)"
    size="50"
    class="self-start cursor-pointer"
    @click="onAgentClick(authorPubKey(mew.header.author))"
    @mouseenter="showProfile(index)"
    @mouseleave="hideProfile(index)"
  >
    <q-menu
      v-model="profileVisible[index]"
      anchor="bottom middle"
      self="top middle"
      :offset="[-10, 5]"
      no-focus
    >
      <ProfilePopup
        :agent-pub-key="authorPubKey(mew.header.author)"
        @mouseenter="keepShowingProfile(index)"
        @mouseleave="hideProfile(index)"
      />
    </q-menu>
  </agent-avatar>
</template>

<script setup lang="ts">
import { HoloHashB64 } from "@holochain-open-dev/core-types";
import { PropType, ref } from "vue";
import { FeedMew } from "@/types/types";
import { authorPubKey } from "@/utils/hash";
import { useRouter } from "vue-router";
import ProfilePopup from "./ProfilePopup.vue";

defineProps({
  mew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const mewsFeed = ref<FeedMew[]>([]);
const profileVisible = ref<boolean[]>([]);
const profileHideTimeouts = ref<number[]>([]);
const profileShowTimeouts = ref<number[]>([]);
const router = useRouter();

const onAgentClick = (agentPubKey: HoloHashB64) => {
  router.push(`/profiles/${agentPubKey}`);
};

const showProfile = (index: number) => {
  profileVisible.value = new Array(mewsFeed.value.length).fill(false);
  profileShowTimeouts.value[index] = window.setTimeout(
    () => (profileVisible.value[index] = true),
    PROFILE_SHOW_HIDE_DELAY
  );
};

const hideProfile = (index: number) => {
  window.clearTimeout(profileShowTimeouts.value[index]);
  profileHideTimeouts.value[index] = window.setTimeout(
    () => (profileVisible.value[index] = false),
    PROFILE_SHOW_HIDE_DELAY
  );
};

const keepShowingProfile = (index: number) => {
  window.clearTimeout(profileHideTimeouts.value[index]);
};
</script>
