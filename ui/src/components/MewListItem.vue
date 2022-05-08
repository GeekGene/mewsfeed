<template>
  <q-item-section avatar>
    <avatar-with-popup :feed-mew="feedMew" :index="index" />
  </q-item-section>

  <q-item-section>
    <div class="row q-mb-sm">
      <span class="q-mr-xs text-primary text-weight-medium">{{
        displayName
      }}</span>
      <span>@{{ agentProfile?.nickname }}</span>
      <q-space />
      <span v-if="feedMew.mew.mewType.mewMew">mewmew from @{{ referencedMewAgentProfile?.nickname }}</span>
      <span v-if="feedMew.mew.mewType.reply">replying to @{{ referencedMewAgentProfile?.nickname }}</span>
      <q-space />
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

  <q-dialog v-model="isReplying" transition-show="fade" transition-hide="fade">
    <q-card>
      <q-card-section class="q-pb-none">
        <div class="q-mb-sm row items-center text-subtitle2">
          <span class="q-mr-sm">Reply to {{ displayName }}</span>
          <span class="text-secondary">@{{ nickname }}</span>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </div>
        <MewContent :feed-mew="feedMew" />
      </q-card-section>

      <q-card-section>
        <AddMew
          class="text-center"
          :mew-type="{ reply: feedMew.mewEntryHash }"
          @publish-mew="publishReply"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { createMew, getFeedMewAndContext, lickMew, unlickMew } from "../services/clutter-dna";
import { computed, onMounted, ref } from "vue";
import { FeedMew, CreateMewInput } from "../types/types";
import { serializeHash } from "@holochain-open-dev/core-types";
import { PropType } from "vue";
import { useProfileStore } from "../services/profile-store";
import AddMew from "./AddMew.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./Timestamp.vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});
const store = useProfileStore();
const referencedMew = ref();
const referencedMewAgentProfile = ref();
const agentProfile = ref();
const displayName = computed(() => agentProfile.value?.fields["Display name"]);
const nickname = computed(() => agentProfile.value?.nickname);
const myAgentPubKey = store.myAgentPubKey;

const emit = defineEmits<{ (e: "refresh-feed"): void }>();

onMounted(async () => {
  agentProfile.value = await store.fetchAgentProfile(
    serializeHash(props.feedMew.header.author)
  );
  const mewType: any = props.feedMew.mew.mewType
  if (mewType.reply || mewType.mewMew || mewType.remew) {
    referencedMew.value = await getFeedMewAndContext(mewType.reply || mewType.mewMew || mewType.remew)
    referencedMewAgentProfile.value = await store.fetchAgentProfile(
      serializeHash(referencedMew.value.header.author)
    );
  }
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

const publishReply = async (mew: CreateMewInput) => {
  await createMew(mew);
  isReplying.value = false;
  emit("refresh-feed");
};
</script>
