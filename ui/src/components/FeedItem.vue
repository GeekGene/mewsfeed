<template>
  <q-item-section avatar>
    <avatar-with-popup :mew="mew" :index="index" />
  </q-item-section>

  <q-item-section>
    <div class="row q-mb-sm">
      <span class="q-mr-xs text-primary text-weight-medium">{{
        displayName
      }}</span>
      <span>@{{ agentProfile?.nickname }}</span>
      <q-space />
      <span class="text-caption">
        <Timestamp :timestamp="mew.header.timestamp" />
      </span>
    </div>

    <MewsItemContent :mew-content="mew" class="q-mb-xs" />

    <div>
      <q-btn
        size="sm"
        :icon="isLickedByMe ? 'favorite' : 'favorite_border'"
        flat
        @click="toggleLickMew"
      >
        {{ mew.licks.length }}
      </q-btn>
      <q-btn size="sm" icon="reply" flat @click="replyToMew">
        {{ mew.comments.length }}
      </q-btn>
      <q-btn size="sm" icon="forward" flat @click="mewMew">
        {{ mew.mewmews.length }}
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
        <MewContent :mew="mew" />
      </q-card-section>

      <q-card-section>
        <AddMew
          class="text-center"
          :mew-type="{ reply: mew.mewEntryHash }"
          @publish-mew="publishReply"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { lickMew, unlickMew } from "../services/clutter-dna";
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
  mew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});
const store = useProfileStore();
const agentProfile = ref();
const displayName = computed(() => agentProfile.value?.fields["Display name"]);
const nickname = computed(() => agentProfile.value?.nickname);
const myAgentPubKey = store.myAgentPubKey;

const emit = defineEmits<{
  (e: "publish-mew", mew: CreateMewInput): void;
  (e: "refresh-feed"): void;
}>();

onMounted(async () => {
  agentProfile.value = await store.fetchAgentProfile(
    serializeHash(props.mew.header.author)
  );
});

const isReplying = ref(false);
const isLickedByMe = computed(() => props.mew.licks.includes(myAgentPubKey));

const toggleLickMew = async () => {
  if (isLickedByMe.value) {
    await unlickMew(props.mew.mewEntryHash);
  } else {
    await lickMew(props.mew.mewEntryHash);
  }
  emit("refresh-feed");
};

const replyToMew = () => (isReplying.value = true);

const mewMew = async () => {
  const createMewInput: CreateMewInput = {
    mewType: { mewMew: props.mew.mewEntryHash },
    mew: props.mew.mew.mew?.mew || null,
  };
  emit("publish-mew", createMewInput);
};

const publishReply = (newMew: CreateMewInput) => {
  isReplying.value = false;
  emit("publish-mew", newMew);
};
</script>
