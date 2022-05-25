<template>
  <agent-avatar
    :agent-pub-key="authorPubKey"
    size="50"
    :class="[
      'self-start',
      { 'cursor-pointer': !isCurrentProfile(authorPubKey) },
    ]"
    @click="onAgentClick(authorPubKey)"
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
        :agent-pub-key="authorPubKey"
        @mouseenter="keepShowingProfile(index)"
        @mouseleave="hideProfile(index)"
      />
    </q-menu>
  </agent-avatar>
</template>

<script setup lang="ts">
import { PropType, ref } from "vue";
import { FeedMew } from "@/types/types";
import { getAuthorPubKey } from "@/utils/hash";
import { useProfileUtils } from "@/utils/profile";
import ProfilePopup from "./ProfilePopup.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const { isCurrentProfile, onAgentClick } = useProfileUtils();
const authorPubKey = getAuthorPubKey(props.feedMew.header.author);

const mewsFeed = ref<FeedMew[]>([]);
const profileVisible = ref<boolean[]>([]);
const profileHideTimeouts = ref<number[]>([]);
const profileShowTimeouts = ref<number[]>([]);

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
