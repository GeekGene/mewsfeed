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
    <MewsFeedContent :mew-content="mew.feedMew" />
  </q-item-section>
  <q-item-section>
    <div>
      <q-btn
        class="like-btn"
        @click="toggleLickMew"
      >
        lick ({{ mew.licks.length }})
      </q-btn>
      <q-btn
        class="reply-btn"
        @click="replyToMew"
      >
        reply ({{ mew.comments.length }})
      </q-btn>
      <q-btn
        class="share-btn"
        @click="shareMew"
      >
        share ({{ mew.shares.length }})
      </q-btn>
      <q-btn
        class="mewmew-btn"
        @click="mewMew"
      >
        mew-mew
      </q-btn>
    </div>
  </q-item-section>
  <q-item-section v-if="isReplying">
    <AddMew
      class="text-center"
      :mew-type="{reply:mew.mewEntryHash}"
      @publish-mew="closeTextBox"
    />
  </q-item-section>
  <q-item-section v-else-if="isMewMewing">
    <AddMew
      class="text-center"
      :mew-type="{mewMew:mew.mewEntryHash}"
      @publish-mew="closeTextBox"
    />
  </q-item-section>
</template>

<script setup lang="ts">
import { HoloHashB64 } from "@holochain-open-dev/core-types";
import { createMew, lickMew, unlickMew, getFeedMewAndContext } from "../services/clutter-dna";
import { onMounted, ref } from "vue";
import {
  FeedMewWithContext as FeedMew,
  Mew,
  CreateMewInput,
} from "../types/types";
import { showError } from "../utils/notification";
import { authorPubKey } from "../utils/hash";
import { useRouter } from "vue-router";
import AddMew from "../components/AddMew.vue";
import MewsFeedContent from "../components/MewsFeedContent.vue";
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

const loading = ref(false);
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
   // check if already licks
   if(isLickedByMe()) {
      // unlick
      await unlickMew(props.mew.mewEntryHash);
      // refreshMew();
   } 
   else {
      // lick
      await lickMew(props.mew.mewEntryHash);
      // refreshMew();
   }
   emit("refresh-feed");
};

const isLickedByMe = () => {
  // check if my agent key is in the returned list of licks
  return props.mew.licks.includes(myAgentPubKey);
};

const replyToMew = () => {
  if(isMewMewing.value) {
    mewMew();
  }
  isReplying.value = !isReplying.value;
};
const mewMew = () => {
  if(isReplying.value) {
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
