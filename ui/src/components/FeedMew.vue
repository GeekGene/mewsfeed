<template>
  <q-item-section avatar>
    <agent-avatar
      :agent-pub-key="authorPubKey(mew.feedMew.header.author)"
      size="50"
      class="self-start cursor-pointer"
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
    <div class="row q-mb-sm">
      <span class="q-mr-xs text-primary text-weight-medium">{{ displayName }} </span>
      <span>@{{ agentProfile?.nickname }}</span>
      <q-space />
      <span class="text-caption">
        <Timestamp :timestamp="mew.feedMew.header.timestamp" />
      </span>
    </div>

    <MewsItemContent
      :mew-content="mew.feedMew"
      class="q-mb-xs"
    />

    <div>
      <q-btn
        size="sm"
        :icon="isLickedByMe() ? 'favorite' : 'favorite_border'"
        flat
        @click="toggleLickMew"
      >
        {{ mew.licks.length }}
      </q-btn>
      <q-btn
        size="sm"
        icon="reply"
        flat
        @click="replyToMew"
      >
        {{ mew.comments.length }}
      </q-btn>
      <q-btn
        size="sm"
        icon="forward"
        flat
        @click="mewMew"
      />
    </div>
  </q-item-section>

  <q-dialog
    v-model="isReplying"
    transition-show="fade"
    transition-hide="fade"
  >
    <q-card>
      <q-card-section class="q-pb-none">
        <div class="q-mb-sm row items-center text-subtitle2">
          <span class="q-mr-sm">Reply to {{ displayName }}</span> 
          <span class="text-secondary">@{{ nickname }}</span> 
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </div>
        <MewsItemContent :mew-content="mew.feedMew" />
      </q-card-section>

      <q-card-section>
        <AddMew
          class="text-center"
          :mew-type="{ reply: mew.mewEntryHash }"
          @publish-mew="closeTextBox"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { HoloHashB64 } from "@holochain-open-dev/core-types";
import { lickMew, unlickMew } from "../services/clutter-dna";
import { computed, onMounted, ref } from "vue";
import {
  FeedMewWithContext as FeedMew,
  CreateMewInput,
} from "../types/types";
import { authorPubKey } from "../utils/hash";
import { useRouter } from "vue-router";
import AddMew from "./AddMew.vue";
import MewsItemContent from "./MewsItemContent.vue";
import ProfilePopup from "./ProfilePopup.vue";
import { PropType } from "vue";
import { useProfileStore } from "../services/profile-store";
import Timestamp from "./Timestamp.vue";

let props = defineProps({
  mew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true }
});
const store = useProfileStore();
const agentProfile = ref();
const displayName = computed(() => agentProfile.value?.fields["Display name"]);
const nickname = computed(() => agentProfile.value?.nickname);
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

onMounted(async () => {
  agentProfile.value = await store.fetchAgentProfile(props.mew.feedMew.header.author);
});

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

const closeTextBox = (newMew: CreateMewInput) => {
  isReplying.value = false;
  isMewMewing.value = false;
  emit("publish-mew", newMew);
};
</script>
