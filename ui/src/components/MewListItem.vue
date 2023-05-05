<template>
  <QItem
    class="items-start cursor-pointer"
    @click.passive="navigateToYarn(feedMew.action_hash)"
  >
    <QItemSection avatar>
      <ProfileAvatarWithPopup :agentPubKey="feedMew.action.author" />
    </QItemSection>

    <QItemSection>
      <div class="row items-start justify-start q-mb-sm">
        <RouterLink
          :to="{
            name: ROUTES.profiles,
            params: { agent: encodeHashToBase64(feedMew.action.author) },
          }"
          @click.stop.prevent
        >
          <span class="q-mr-xs text-primary text-weight-bold">
            {{ agentProfile?.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
          </span>
          <span>@{{ agentProfile?.nickname }}</span>
        </RouterLink>

        <span v-if="!isOriginal" class="q-ml-md">
          <QSkeleton v-if="loadingOriginalMewAuthor" type="text" width="4rem" />
          <div
            v-else-if="originalMew && originalMewAuthor"
            class="row justify-start items-start"
          >
            <span class="q-mr-xs text-secondary">
              {{ reactionLabel }}
            </span>
            <RouterLink
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
            </RouterLink>
            <QBtn
              v-if="showYarnLink"
              class="q-mx-sm q-px-sm"
              padding="none"
              margin="none"
              flat
              color="dark"
              size="xs"
              @click.stop="
                originalMew && navigateToYarn(originalMew.action_hash)
              "
            >
              <QIcon
                name="svguse:/icons.svg#yarn"
                size="xs"
                color="secondary"
                flat
              />
              <QTooltip :delay="TOOLTIP_DELAY">Original Yarn</QTooltip>
            </QBtn>
          </div>
        </span>

        <QSpace />

        <span class="q-ml-md text-caption">
          <timestamp :timestamp="feedMew.action.timestamp" />
        </span>
      </div>

      <mew-content
        :feed-mew="originalMew && isMewmew ? originalMew : feedMew"
        class="q-my-sm cursor-pointer"
      />

      <div class="row justify-between">
        <div>
          <QBtn
            :disable="isUpdatingLick"
            size="sm"
            flat
            @click.stop.prevent="toggleLickMew"
          >
            <QIcon
              name="svguse:/icons.svg#lick"
              :color="isLickedByMe ? 'pink-4' : 'transparent'"
              class="q-mr-xs"
            />
            {{ feedMew.licks.length }}
            <QTooltip :delay="TOOLTIP_DELAY">Lick mew</QTooltip>
          </QBtn>
          <QBtn size="sm" icon="reply" flat @click.stop.prevent="replyToMew">
            {{ feedMew.replies.length }}
            <QTooltip :delay="TOOLTIP_DELAY">Reply to mew</QTooltip>
          </QBtn>
          <QBtn size="sm" icon="forward" flat @click.stop.prevent="mewMew">
            {{ feedMew.mewmews.length }}
            <QTooltip :delay="TOOLTIP_DELAY">Mewmew mew</QTooltip>
          </QBtn>
          <QBtn size="sm" icon="format_quote" flat @click.stop.prevent="quote">
            {{ feedMew.quotes.length }}
            <QTooltip :delay="TOOLTIP_DELAY">Quote mew</QTooltip>
          </QBtn>
        </div>
      </div>
    </QItemSection>
  </QItem>
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
  Mew,
  FeedMew,
  MewType,
  MewTypeName,
  PROFILE_FIELDS,
  TOOLTIP_DELAY,
} from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { QItem, useQuasar } from "quasar";
import { computed, onMounted, PropType, ref } from "vue";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./MewTimestamp.vue";
import { useMyProfile } from "@/utils/profile";
import { isSameHash } from "@/utils/hash";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  onToggleLickMew: {
    type: Function as PropType<(hash: ActionHash) => Promise<void>>,
    required: true,
  },
  onPublishMew: {
    type: Function as PropType<(mew_type: MewType) => Promise<void>>,
    required: true,
  },
  showYarnLink: {
    type: Boolean,
    default: true,
  },
});

const $q = useQuasar();

const profilesStore = useProfilesStore();
const agentProfile = ref<Profile>();
const { runWhenMyProfileExists } = useMyProfile();

const originalMewHash =
  MewTypeName.Mewmew in props.feedMew.mew.mew_type
    ? props.feedMew.mew.mew_type.Mewmew
    : MewTypeName.Reply in props.feedMew.mew.mew_type
    ? props.feedMew.mew.mew_type.Reply
    : MewTypeName.Quote in props.feedMew.mew.mew_type
    ? props.feedMew.mew.mew_type.Quote
    : props.feedMew.mew.mew_type.Original;

const originalMew = ref<FeedMew>();
const originalMewAuthor = ref<Profile>();
const loadingOriginalMewAuthor = ref<boolean>();
const isUpdatingLick = ref(false);

const isMewmew = computed(
  () => MewTypeName.Mewmew in props.feedMew.mew.mew_type
);
const isOriginal = computed(
  () => MewTypeName.Original in props.feedMew.mew.mew_type
);
const isReply = computed(() => MewTypeName.Reply in props.feedMew.mew.mew_type);
const reactionLabel = computed(() =>
  isMewmew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
);
const isLickedByMe = computed(() =>
  props.feedMew.licks.some((lick) =>
    isSameHash(lick, profilesStore.value.client.client.myPubKey)
  )
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
      await unlickMew(props.feedMew.action_hash);
    } else {
      await lickMew(props.feedMew.action_hash);
    }
    await props.onToggleLickMew(props.feedMew.action_hash);
    isUpdatingLick.value = false;
  });
};

const replyToMew = () => {
  runWhenMyProfileExists(() => {
    $q.dialog({
      component: CreateMewDialog,
      componentProps: {
        mewType: { [MewTypeName.Reply]: props.feedMew.action_hash },
        onPublishMew: props.onPublishMew,
        originalMew: props.feedMew,
        originalAuthor: agentProfile.value,
      },
    });
  });
};

const mewMew = async () => {
  runWhenMyProfileExists(async () => {
    const mew_type = { [MewTypeName.Mewmew]: props.feedMew.action_hash };
    const mew: Mew = {
      mew_type,
      text: "",
      links: [],
    };
    await createMew(mew);
    props.onPublishMew(mew_type);
  });
};

const quote = () => {
  runWhenMyProfileExists(() => {
    $q.dialog({
      component: CreateMewDialog,
      componentProps: {
        mewType: { [MewTypeName.Quote]: props.feedMew.action_hash },
        onPublishMew: props.onPublishMew,
        originalMew: props.feedMew,
        originalAuthor: agentProfile.value,
      },
    });
  });
};
</script>
