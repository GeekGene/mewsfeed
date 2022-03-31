<template>
  <q-item-section avatar>
    <agent-avatar
      :agent-pub-key="authorPubKey(mew.feedMew.header.author)"
      size="50"
      class="cursor-pointer"
      @click="onAgentClick(authorPubKey(mew.feedMew.header.author))"
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
          :agent-pub-key="authorPubKey(mew.feedMew.header.author)"
          @mouseenter="keepShowingProfile(index)"
          @mouseleave="hideProfile(index)"
        />
      </q-menu>
    </agent-avatar>
  </q-item-section>

  <q-item-section>
    <MewsItemContent :mew-content="mew.feedMew" />
  </q-item-section>

  <q-item-section class="col-shrink">
    <div>
      <q-btn
        class="like-btn"
        size="sm"
        :icon="isLickedByMe() ? 'favorite' : 'favorite_border'"
        @click="toggleLickMew"
      >
        {{ mew.licks.length }}
      </q-btn>
      <q-btn
        class="reply-btn"
        size="sm"
        icon="reply"
        @click="replyToMew"
      >
        {{ mew.comments.length }}
      </q-btn>
      <q-btn
        class="mewmew-btn"
        size="sm"
        icon="forward"
        @click="mewMew"
      />
    </div>
  </q-item-section>
  <q-item-section v-if="isReplying">
    <AddMew
      class="text-center"
      :mew-type="{ reply: mew.mewEntryHash }"
      @publish-mew="closeTextBox"
    />
  </q-item-section>
  <q-item-section v-else-if="isMewMewing">
    <AddMew
      class="text-center"
      :mew-type="{ mewMew: mew.mewEntryHash }"
      @publish-mew="closeTextBox"
    />
  </q-item-section>
</template>

<script setup lang="ts">
import { HoloHashB64 } from "@holochain-open-dev/core-types";
import { lickMew, unlickMew } from "../services/clutter-dna";
import { ref } from "vue";
import {
  FeedMewWithContext as FeedMew,
  CreateMewInput,
} from "../types/types";
import { authorPubKey } from "../utils/hash";
import { useRouter } from "vue-router";
import AddMew from "../components/AddMew.vue";
import MewsItemContent from "../components/MewsItemContent.vue";
import ProfilePopup from "../components/ProfilePopup.vue";
import { PropType } from "vue";
import { useProfileStore } from "../services/profile-store";

let props = defineProps({
  mew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true }
});
const store = useProfileStore();
const myAgentPubKey = store.myAgentPubKey;

const PROFILE_SHOW_HIDE_DELAY = 400; // in ms

const router = useRouter();

const mewsFeed = ref<FeedMew[]>([]);
const profileVisible = ref<boolean[]>([]);
const profileHideTimeouts = ref<number[]>([]);
const profileShowTimeouts = ref<number[]>([]);
const emit = defineEmits<{
  (e: 'publish-mew', mew: CreateMewInput): void;
  (e: 'refresh-feed'): void;
}>();

let isReplying = ref(false);
let isMewMewing = ref(false);

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

const toggleLickMew = async () => {
  if (isLickedByMe()) {
    await unlickMew(props.mew.mewEntryHash);
  } else {
    await lickMew(props.mew.mewEntryHash);
  }
  emit("refresh-feed");
};

const isLickedByMe = () => props.mew.licks.includes(myAgentPubKey);

const replyToMew = () => {
  if (isMewMewing.value) {
    mewMew();
  }
  isReplying.value = !isReplying.value;
};
const mewMew = () => {
  if (isReplying.value) {
    replyToMew();
  }
  isMewMewing.value = !isMewMewing.value;
};
const shareMew = () => {
  //TODO: enforce 1 share per mew
  const mew: CreateMewInput = {
    mewType: {
      reMew: props.mew.mewEntryHash
    },
    mew: null
  };
  emit("publish-mew", mew);
};

const closeTextBox = (newMew: CreateMewInput) => {
  isReplying.value = false;
  isMewMewing.value = false;
  emit("publish-mew", newMew);
};
</script>
