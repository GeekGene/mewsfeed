<template>
  <q-item-section avatar>
    <avatar-with-popup :agent-pub-key="feedMew.header.author" />
  </q-item-section>

  <q-item-section>
    <div class="row q-mb-sm">
      <div
        :class="{ 'cursor-pointer': !isCurrentProfile(urlSafeAgentPubKey) }"
        @click="onAgentClick(urlSafeAgentPubKey)"
      >
        <span class="q-mr-xs text-primary text-weight-bold">
          {{ displayName }}
        </span>
        <span>@{{ agentProfile?.nickname }}</span>
      </div>

      <span v-if="!isOriginal" class="text-secondary q-ml-md">
        <q-skeleton v-if="loadingOriginalMewAuthor" type="text" width="4rem" />
        <template v-else>
          {{ reactionLabel }}
          <span class="text-bold">
            {{ originalMewAuthor?.fields["Display name"] }}
          </span>
          @{{ originalMewAuthor?.nickname }}
        </template>
      </span>

      <q-space />

      <span class="text-caption">
        <timestamp :timestamp="feedMew.header.timestamp" />
      </span>
    </div>

    <mew-content
      :feed-mew="originalMew && isMewMew ? originalMew : feedMew"
      class="q-mb-xs"
    />

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
        {{ feedMew.replies.length }}
      </q-btn>
      <q-btn size="sm" icon="forward" flat @click="mewMew">
        {{ feedMew.mewmews.length }}
      </q-btn>
      <q-btn size="sm" icon="format_quote" flat @click="quote">
        {{ feedMew.quotes.length }}
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
      <span>
        Reply to
        <span class="q-mr-xs text-primary text-bold">{{ displayName }}</span>
        <span>@{{ nickname }}</span>
      </span>
    </template>
    <template #subtitle>
      <div class="text-grey-7">
        <mew-content :feed-mew="feedMew" />
      </div>
    </template>
  </create-mew-dialog>

  <create-mew-dialog
    v-if="isQuoting"
    :mew-type="{ quote: feedMew.mewEntryHash }"
    @mew-created="onMewCreated"
    @close="isQuoting = false"
  >
    <template #title>
      <span>
        Quote
        <span class="q-mr-xs text-primary text-bold">{{ displayName }}</span>
        <span>@{{ nickname }}</span>
      </span>
    </template>
    <template #subtitle>
      <div class="text-grey-7">
        <mew-content :feed-mew="feedMew" />
      </div>
    </template>
  </create-mew-dialog>
</template>

<script setup lang="ts">
import { useProfileStore } from "@/services/profile-store";
import { CreateMewInput, FeedMew, MewTypeName } from "@/types/types";
import { getUrlSafeAgentPubKey } from "@/utils/hash";
import { useProfileUtils } from "@/utils/profile";
import { serializeHash } from "@holochain-open-dev/core-types";
import { Profile } from "@holochain-open-dev/profiles";
import { computed, onMounted, PropType, ref } from "vue";
import {
  createMew,
  getFeedMewAndContext,
  lickMew,
  unlickMew,
} from "../services/clutter-dna";
import AvatarWithPopup from "./AvatarWithPopup.vue";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./Timestamp.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});

const profileStore = useProfileStore();
const { isCurrentProfile, onAgentClick } = useProfileUtils();
const urlSafeAgentPubKey = getUrlSafeAgentPubKey(props.feedMew.header.author);
const agentProfile = ref();
const displayName = computed(() => agentProfile.value?.fields["Display name"]);
const nickname = computed(() => agentProfile.value?.nickname);
const myAgentPubKey = profileStore.myAgentPubKey;

const isMewMew = computed(
  () => MewTypeName.MewMew in props.feedMew.mew.mewType
);
const isReply = computed(() => MewTypeName.Reply in props.feedMew.mew.mewType);
const isOriginal = computed(
  () => MewTypeName.Original in props.feedMew.mew.mewType
);
const originalMew = ref<FeedMew>();
const originalMewAuthor = ref<Profile>();
const loadingOriginalMewAuthor = ref<boolean>();
const reactionLabel = computed(() =>
  isMewMew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
);

const emit = defineEmits<{ (e: "refresh-feed"): void }>();

onMounted(async () => {
  agentProfile.value = await profileStore.fetchAgentProfile(
    serializeHash(props.feedMew.header.author)
  );

  // load original mew author if item is a mewmew or quote
  if (!(MewTypeName.Original in props.feedMew.mew.mewType)) {
    loadingOriginalMewAuthor.value = true;
    const originalMewHash =
      MewTypeName.MewMew in props.feedMew.mew.mewType
        ? props.feedMew.mew.mewType.mewMew
        : MewTypeName.Reply in props.feedMew.mew.mewType
        ? props.feedMew.mew.mewType.reply
        : props.feedMew.mew.mewType.quote;
    getFeedMewAndContext(originalMewHash)
      .then((mew) => {
        originalMew.value = mew;
        profileStore
          .fetchAgentProfile(serializeHash(mew.header.author))
          .then((profile) => (originalMewAuthor.value = profile));
      })
      .finally(() => (loadingOriginalMewAuthor.value = false));
  }
});

const isReplying = ref(false);
const isQuoting = ref(false);
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
    text: null,
  };
  await createMew(mew);
  emit("refresh-feed");
};

const quote = () => (isQuoting.value = true);

const onMewCreated = () => {
  isReplying.value = false;
  isQuoting.value = false;
};
</script>
