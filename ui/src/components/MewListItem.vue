<template>
  <q-item-section avatar>
    <avatar-with-popup :feed-mew="feedMew" :index="index" />
  </q-item-section>

  <q-item-section>
    <div class="row q-mb-sm">
      <span class="q-mr-xs text-primary text-weight-medium">
        {{ displayName }}
      </span>
      <span>@{{ agentProfile?.nickname }}</span>
      <q-space />
      <span class="text-caption">
        <Timestamp :timestamp="feedMew.header.timestamp" />
      </span>
    </div>

    <MewContent :feed-mew="feedMew" class="q-mb-xs" />

    <div>
      <q-btn
        size="sm"
        :icon="isLickedByMe ? 'favorite' : 'favorite_border'"
        flat
        @click="toggleLickMew"
      >
        {{ feedMew.licks.length }}
      </q-btn>
      <q-btn size="sm" icon="reply" flat @click="replyToMew">
        {{ feedMew.comments.length }}
      </q-btn>
      <q-btn size="sm" icon="forward" flat @click="mewMew">
        {{ feedMew.mewmews.length }}
      </q-btn>
    </div>
  </q-item-section>

  <create-mew-dialog
    v-if="isReplying"
    :mew-type="{ reply: feedMew.mewEntryHash }"
    @mew-created="onMewCreated"
    @close="isReplying = false"
  >
    <template #title>
      <span class="q-mr-sm">Reply to {{ displayName }}</span>
      <span class="text-secondary">@{{ nickname }}</span>
    </template>
    <template #subtitle>
      <MewContent :feed-mew="feedMew" />
    </template>
  </create-mew-dialog>
</template>

<script setup lang="ts">
import { createMew, lickMew, unlickMew } from "../services/clutter-dna";
import { computed, onMounted, ref } from "vue";
import { FeedMew, CreateMewInput } from "../types/types";
import { serializeHash } from "@holochain-open-dev/core-types";
import { PropType } from "vue";
import { useProfileStore } from "../services/profile-store";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./Timestamp.vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});
const store = useProfileStore();
const agentProfile = ref();
const displayName = computed(() => agentProfile.value?.fields["Display name"]);
const nickname = computed(() => agentProfile.value?.nickname);
const myAgentPubKey = store.myAgentPubKey;

const emit = defineEmits<{ (e: "refresh-feed"): void }>();

onMounted(async () => {
  agentProfile.value = await store.fetchAgentProfile(
    serializeHash(props.feedMew.header.author)
  );
});

const isReplying = ref(false);
const isLickedByMe = computed(() =>
  props.feedMew.licks.includes(myAgentPubKey)
);

const toggleLickMew = async () => {
  if (isLickedByMe.value) {
    await unlickMew(props.feedMew.mewEntryHash);
  } else {
    await lickMew(props.feedMew.mewEntryHash);
  }
  emit("refresh-feed");
};

const replyToMew = () => (isReplying.value = true);

const mewMew = async () => {
  const mew: CreateMewInput = {
    mewType: { mewMew: props.feedMew.mewEntryHash },
    text: props.feedMew.mew.content?.text || null,
  };
  await createMew(mew);
  emit("refresh-feed");
};

const onMewCreated = () => (isReplying.value = false);
</script>
