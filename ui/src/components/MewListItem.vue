<template>
  <q-item
    class="items-start cursor-pointer"
    @click.passive="navigateToYarn(feedMew.actionHash)"
  >
    <q-item-section avatar>
      <AvatarWithPopup :agentPubKey="feedMew.action.author" />
    </q-item-section>

    <q-item-section>
      <div class="row items-start justify-start q-mb-sm">
        <div @click.stop.prevent="onAgentClick(feedMew.action.author)">
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
          <div
            v-else-if="originalMew && originalMewAuthor"
            class="row justify-start items-start"
          >
            <span class="q-mr-xs text-secondary">
              {{ reactionLabel }}
            </span>
            <router-link
              :to="{
                name: ROUTES.profiles,
                params: {
                  agent: encodeHashToBase64(originalMew.action.author),
                },
              }"
              class="text-secondary"
            >
              <span class="text-bold">
                {{ originalMewAuthor.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
              </span>
              @{{ originalMewAuthor.nickname }}
            </router-link>
            <q-btn
              v-if="showYarnLink"
              class="q-mx-sm q-px-sm"
              padding="none"
              margin="none"
              flat
              color="dark"
              size="xs"
              @click.stop="
                originalMew && navigateToYarn(originalMew.actionHash)
              "
            >
              <q-icon
                name="svguse:/icons.svg#yarn"
                size="xs"
                color="secondary"
                flat
              />
              <q-tooltip :delay="TOOLTIP_DELAY">Original Yarn</q-tooltip>
            </q-btn>
          </div>
        </span>

        <q-space />

        <span class="q-ml-md text-caption">
          <timestamp :timestamp="feedMew.action.timestamp" />
        </span>
      </div>

      <mew-content
        :feed-mew="originalMew && isMewMew ? originalMew : feedMew"
        class="q-my-sm cursor-pointer"
      />

      <div class="row justify-between">
        <div>
          <q-btn
            :disable="isUpdatingLick"
            size="sm"
            flat
            @click.stop.prevent="toggleLickMew"
          >
            <q-icon
              name="svguse:/icons.svg#lick"
              :color="isLickedByMe ? 'pink-4' : 'transparent'"
              class="q-mr-xs"
            />
            {{ feedMew.licks.length }}
            <q-tooltip :delay="TOOLTIP_DELAY">Lick mew</q-tooltip>
          </q-btn>
          <q-btn size="sm" icon="reply" flat @click.stop.prevent="replyToMew">
            {{ feedMew.replies.length }}
            <q-tooltip :delay="TOOLTIP_DELAY">Reply to mew</q-tooltip>
          </q-btn>
          <q-btn size="sm" icon="forward" flat @click.stop.prevent="mewMew">
            {{ feedMew.mewmews.length }}
            <q-tooltip :delay="TOOLTIP_DELAY">Mewmew mew</q-tooltip>
          </q-btn>
          <q-btn size="sm" icon="format_quote" flat @click.stop.prevent="quote">
            {{ feedMew.quotes.length }}
            <q-tooltip :delay="TOOLTIP_DELAY">Quote mew</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import router, { ROUTES } from "@/router";
import {
  createMew,
  getFeedMewAndContext,
  lickMew,
  unlickMew,
} from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/services/profiles-store";
import {
  CreateMewInput,
  FeedMew,
  MewType,
  MewTypeName,
  PROFILE_FIELDS,
  TOOLTIP_DELAY,
} from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { useProfileUtils } from "@/utils/profile";
import { Profile } from "@holochain-open-dev/profiles";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { QItem, useQuasar } from "quasar";
import { computed, onMounted, PropType, ref } from "vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./MewTimestamp.vue";
import { useMyProfile } from "@/utils/profile";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  onToggleLickMew: {
    type: Function as PropType<(hash: ActionHash) => Promise<void>>,
    required: true,
  },
  onPublishMew: {
    type: Function as PropType<(mewType: MewType) => Promise<void>>,
    required: true,
  },
  showYarnLink: {
    type: Boolean,
    default: true,
  },
});

const $q = useQuasar();

const profilesStore = useProfilesStore();
const { onAgentClick } = useProfileUtils();
const agentProfile = ref<Profile>();
const myAgentPubKey = profilesStore.value.client.client.myPubKey;
const { runWhenMyProfileExists } = useMyProfile();

const originalMewHash =
  MewTypeName.MewMew in props.feedMew.mew.mewType
    ? props.feedMew.mew.mewType.mewMew
    : MewTypeName.Reply in props.feedMew.mew.mewType
    ? props.feedMew.mew.mewType.reply
    : MewTypeName.Quote in props.feedMew.mew.mewType
    ? props.feedMew.mew.mewType.quote
    : props.feedMew.mew.mewType.original;

const originalMew = ref<FeedMew>();
const originalMewAuthor = ref<Profile>();
const loadingOriginalMewAuthor = ref<boolean>();
const isUpdatingLick = ref(false);

const isMewMew = computed(
  () => MewTypeName.MewMew in props.feedMew.mew.mewType
);
const isOriginal = computed(
  () => MewTypeName.Original in props.feedMew.mew.mewType
);
const isReply = computed(() => MewTypeName.Reply in props.feedMew.mew.mewType);
const reactionLabel = computed(() =>
  isMewMew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
);
const isLickedByMe = computed(() =>
  props.feedMew.licks.some((lick) => isSameHash(lick, myAgentPubKey))
);

onMounted(async () => {
  agentProfile.value = await profilesStore.value.client.getAgentProfile(
    props.feedMew.action.author
  );

  if (originalMewHash) loadOriginalMew(originalMewHash);
});

const loadOriginalMew = async (actionHash: ActionHash) => {
  originalMew.value = await getFeedMewAndContext(actionHash);

  // load original mew author
  loadingOriginalMewAuthor.value = true;
  originalMewAuthor.value = await profilesStore.value.client.getAgentProfile(
    originalMew.value.action.author
  );
  loadingOriginalMewAuthor.value = false;
};

const navigateToYarn = (actionHash: ActionHash) => {
  router.push({
    name: ROUTES.yarn,
    params: { hash: encodeHashToBase64(actionHash) },
  });
};

const toggleLickMew = async () => {
  runWhenMyProfileExists(async () => {
    isUpdatingLick.value = true;
    if (isLickedByMe.value) {
      await unlickMew(props.feedMew.actionHash);
    } else {
      await lickMew(props.feedMew.actionHash);
    }
    await props.onToggleLickMew(props.feedMew.actionHash);
    isUpdatingLick.value = false;
  });
};

const replyToMew = () => {
  runWhenMyProfileExists(() => {
    $q.dialog({
      component: CreateMewDialog,
      componentProps: {
        mewType: { [MewTypeName.Reply]: props.feedMew.actionHash },
        onPublishMew: props.onPublishMew,
        originalMew: props.feedMew,
        originalAuthor: agentProfile.value,
      },
    });
  });
};

const mewMew = async () => {
  runWhenMyProfileExists(async () => {
    const mewType = { mewMew: props.feedMew.actionHash };
    const mew: CreateMewInput = {
      mewType,
      text: null,
    };
    await createMew(mew);
    props.onPublishMew(mewType);
  });
};

const quote = () => {
  runWhenMyProfileExists(() => {
    $q.dialog({
      component: CreateMewDialog,
      componentProps: {
        mewType: { [MewTypeName.Quote]: props.feedMew.actionHash },
        onPublishMew: props.onPublishMew,
        originalMew: props.feedMew,
        originalAuthor: agentProfile.value,
      },
    });
  });
};
</script>
