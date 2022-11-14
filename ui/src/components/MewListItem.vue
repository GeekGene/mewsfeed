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
              {{ agentProfile?.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
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
          class="q-mb-xs cursor-pointer"
        />

        <div>
          <q-btn
            :disable="isUpdatingLick"
            size="sm"
            flat
            @click="toggleLickMew"
          >
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
    </template>

    <template v-if="showOriginalMew" #default>
      <!-- compile error when v-if condition is moved to outer v-if -->
      <mew-list-item v-if="originalMew" :feed-mew="originalMew" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import { createMew, lickMew, unlickMew } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { useClutterStore } from "@/stores";
import {
  CreateMewInput,
  FeedMew,
  MewTypeName,
  PROFILE_FIELDS,
} from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { useProfileUtils } from "@/utils/profile";
import { Profile } from "@holochain-open-dev/profiles";
import { serializeHash } from "@holochain-open-dev/utils";
import { QExpansionItem, QItem, useQuasar } from "quasar";
import { computed, onMounted, PropType, ref } from "vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./Timestamp.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const $q = useQuasar();

const store = useClutterStore();

const profilesStore = useProfilesStore();
const { isCurrentProfile, onAgentClick } = useProfileUtils();
const agentProfile = ref<Profile>();
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

const originalMewHash =
  MewTypeName.MewMew in props.feedMew.mew.mewType
    ? props.feedMew.mew.mewType.mewMew
    : MewTypeName.Reply in props.feedMew.mew.mewType
    ? props.feedMew.mew.mewType.reply
    : MewTypeName.Quote in props.feedMew.mew.mewType
    ? props.feedMew.mew.mewType.quote
    : new Uint8Array();
const originalMew = computed(() =>
  store.mewsFeed.find((m) => isSameHash(m.actionHash, originalMewHash))
);
const originalMewAuthor = ref<Profile>();
const loadingOriginalMewAuthor = ref<boolean>();
const reactionLabel = computed(() =>
  isMewMew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
);

const isUpdatingLick = ref(false);
const isLickedByMe = computed(() =>
  props.feedMew.licks.some((lick) => isSameHash(lick, myAgentPubKey))
);

onMounted(async () => {
  const agentProfileReadable = await profilesStore.value.fetchAgentProfile(
    props.feedMew.action.author
  );
  agentProfileReadable.subscribe((profile) => (agentProfile.value = profile));

  if (MewTypeName.Original in props.feedMew.mew.mewType || !originalMew.value) {
    return;
  }
  // load original mew author if item is a reply, mewmew or quote
  loadingOriginalMewAuthor.value = true;
  profilesStore.value
    .fetchAgentProfile(originalMew.value.action.author)
    .then((profileReadable) => {
      profileReadable.subscribe(
        (profile) => (originalMewAuthor.value = profile)
      );
    })
    .finally(() => (loadingOriginalMewAuthor.value = false));
});

const toggleLickMew = async () => {
  isUpdatingLick.value = true;
  if (isLickedByMe.value) {
    await unlickMew(props.feedMew.actionHash);
  } else {
    await lickMew(props.feedMew.actionHash);
  }
  await store.reloadMew(props.feedMew.actionHash);
  isUpdatingLick.value = false;
};

const replyToMew = () =>
  $q.dialog({
    component: CreateMewDialog,
    componentProps: {
      mewType: { [MewTypeName.Reply]: props.feedMew.actionHash },
      originalMew: props.feedMew,
      originalAuthor: agentProfile.value,
    },
  });

const mewMew = async () => {
  const mew: CreateMewInput = {
    mewType: { mewMew: props.feedMew.actionHash },
    text: null,
  };
  await createMew(mew);
  store.fetchMewsFeed();
};

const quote = () =>
  $q.dialog({
    component: CreateMewDialog,
    componentProps: {
      mewType: { [MewTypeName.Quote]: props.feedMew.actionHash },
      originalMew: props.feedMew,
      originalAuthor: agentProfile.value,
    },
  });
</script>
