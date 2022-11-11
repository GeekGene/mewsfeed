<template>
  <component
    :is="showOriginalMew ? QExpansionItem : QItem"
    :content-inset-level="showOriginalMew ? 1 : undefined"
    :class="showOriginalMew ? undefined : 'items-start'"
    :header-class="showOriginalMew ? 'items-start' : undefined"
    :expand-icon-toggle="showOriginalMew ? true : undefined"
  >
    <template #[slotName]>
      <q-item-section avatar>
        <avatar-with-popup :agent-pub-key="feedMew.action.author" />
      </q-item-section>

      <q-item-section>
        <div class="row q-mb-sm">
          <div
            :class="{
              'cursor-pointer': !isCurrentProfile(feedMew.action.author),
            }"
            @click="onAgentClick(feedMew.action.author)"
          >
            <span class="q-mr-xs text-primary text-weight-bold">
              {{ displayName }}
            </span>
            <span>@{{ agentProfile?.nickname }}</span>
          </div>

          <span v-if="!isOriginal" class="q-ml-md">
            <q-skeleton
              v-if="loadingOriginalMewAuthor"
              type="text"
              width="4rem"
            />
            <router-link
              v-else-if="originalMew && originalMewAuthor"
              :to="{
                name: ROUTES.profiles,
                params: { agent: serializeHash(originalMew.action.author) },
              }"
              class="text-secondary"
            >
              {{ reactionLabel }}
              <span class="text-bold">
                {{ originalMewAuthor.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
              </span>
              @{{ originalMewAuthor.nickname }}
            </router-link>
          </span>

          <q-space />

          <span class="q-ml-md text-caption">
            <timestamp :timestamp="feedMew.action.timestamp" />
          </span>
        </div>

        <mew-content
          :feed-mew="originalMew && isMewMew ? originalMew : feedMew"
          class="q-mb-xs"
        />

        <div>
          <q-btn size="sm" flat @click="toggleLickMew">
            <q-icon
              name="svguse:/icons.svg#lick"
              :color="isLickedByMe ? 'pink-4' : 'transparent'"
              class="q-mr-xs"
            />
            {{ feedMew.licks.length }}
            <q-tooltip>Lick mew</q-tooltip>
          </q-btn>
          <q-btn size="sm" icon="reply" flat @click="replyToMew">
            {{ feedMew.replies.length }}
            <q-tooltip>Reply to mew</q-tooltip>
          </q-btn>
          <q-btn size="sm" icon="forward" flat @click="mewMew">
            {{ feedMew.mewmews.length }}
            <q-tooltip>Mewmew mew</q-tooltip>
          </q-btn>
          <q-btn size="sm" icon="format_quote" flat @click="quote">
            {{ feedMew.quotes.length }}
            <q-tooltip>Quote mew</q-tooltip>
          </q-btn>
        </div>
      </q-item-section>

      <create-mew-dialog
        v-if="isReplying"
        :mew-type="{ reply: feedMew.actionHash }"
        @mew-created="onMewCreated"
        @close="isReplying = false"
      >
        <template #title>
          <span>
            Reply to
            <span class="q-mr-xs text-primary text-bold">{{
              displayName
            }}</span>
            <span>@{{ nickname }}</span>
          </span>
        </template>
        <template #content>
          <div class="text-grey-7">
            <mew-content :feed-mew="feedMew" />
          </div>
        </template>
      </create-mew-dialog>

      <create-mew-dialog
        v-if="isQuoting"
        :mew-type="{ quote: feedMew.actionHash }"
        @mew-created="onMewCreated"
        @close="isQuoting = false"
      >
        <template #title>
          <span>
            Quote
            <span class="q-mr-xs text-primary text-bold">{{
              displayName
            }}</span>
            <span>@{{ nickname }}</span>
          </span>
        </template>
        <template #content>
          <div class="text-grey-7">
            <mew-content :feed-mew="feedMew" />
          </div>
        </template>
      </create-mew-dialog>
    </template>

    <template v-if="showOriginalMew" #default>
      <!-- compile error when v-if condition is moved to outer v-if -->
      <mew-list-item v-if="originalMew" :feed-mew="originalMew" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import {
  createMew,
  getFeedMewAndContext,
  lickMew,
  unlickMew,
} from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import {
  CreateMewInput,
  FeedMew,
  MewTypeName,
  PROFILE_FIELDS,
} from "@/types/types";
import { isSameAgentPubKey } from "@/utils/hash";
import { useProfileUtils } from "@/utils/profile";
import { Profile } from "@holochain-open-dev/profiles";
import { serializeHash } from "@holochain-open-dev/utils";
import { QExpansionItem, QItem } from "quasar";
import { computed, onMounted, PropType, ref } from "vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./Timestamp.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const profilesStore = useProfilesStore();
const { isCurrentProfile, onAgentClick } = useProfileUtils();
const agentProfile = ref();
const displayName = computed(
  () => agentProfile.value?.fields[PROFILE_FIELDS.DISPLAY_NAME]
);
const nickname = computed(() => agentProfile.value?.nickname);
const myAgentPubKey = profilesStore.value.myAgentPubKey;

const isMewMew = computed(
  () => MewTypeName.MewMew in props.feedMew.mew.mewType
);
const isOriginal = computed(
  () => MewTypeName.Original in props.feedMew.mew.mewType
);
const isReply = computed(() => MewTypeName.Reply in props.feedMew.mew.mewType);
const isQuote = computed(() => MewTypeName.Quote in props.feedMew.mew.mewType);
const showOriginalMew = computed(() => isReply.value || isQuote.value);
const slotName = computed(() => (showOriginalMew.value ? "header" : "default"));
const originalMew = ref<FeedMew>();
const originalMewAuthor = ref<Profile>();
const loadingOriginalMewAuthor = ref<boolean>();
const reactionLabel = computed(() =>
  isMewMew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
);

const emit = defineEmits<{ (e: "refresh-feed"): void }>();

onMounted(async () => {
  const agentProfileReadable = await profilesStore.value.fetchAgentProfile(
    props.feedMew.action.author
  );
  agentProfileReadable.subscribe((profile) => (agentProfile.value = profile));

  if (MewTypeName.Original in props.feedMew.mew.mewType) {
    return;
  }
  // load original mew author if item is a reply, mewmew or quote
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
      profilesStore.value
        .fetchAgentProfile(mew.action.author)
        .then((profileReadable) => {
          profileReadable.subscribe(
            (profile) => (originalMewAuthor.value = profile)
          );
        });
    })
    .finally(() => (loadingOriginalMewAuthor.value = false));
});

const isReplying = ref(false);
const isQuoting = ref(false);
const isLickedByMe = computed(() =>
  props.feedMew.licks.some((lick) => isSameAgentPubKey(lick, myAgentPubKey))
);

const toggleLickMew = async () => {
  if (isLickedByMe.value) {
    await unlickMew(props.feedMew.actionHash);
  } else {
    await lickMew(props.feedMew.actionHash);
  }
  emit("refresh-feed");
};

const replyToMew = () => (isReplying.value = true);

const mewMew = async () => {
  const mew: CreateMewInput = {
    mewType: { mewMew: props.feedMew.actionHash },
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
