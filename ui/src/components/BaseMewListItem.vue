<template>
  <QItem
    class="items-start cursor-pointer"
    @click.passive="navigateToYarn(feedMew.action_hash)"
  >
    <QItemSection avatar>
      <ProfileAvatarWithPopup :agentPubKey="feedMew.action.author" />
    </QItemSection>

    <QItemSection>
      <div class="row justify-start items-center q-mb-sm">
        <RouterLink
          :to="{
            name: ROUTES.profile,
            params: { agent: encodeHashToBase64(feedMew.action.author) },
          }"
          @click.stop.prevent
        >
          <template v-if="feedMew.author_profile">
            <span class="q-mr-xs text-primary text-weight-bold">
              {{ feedMew.author_profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
            </span>
            <span>@{{ feedMew.author_profile.nickname }}</span>
          </template>
          <span v-else>
            {{ encodeHashToBase64(feedMew.action.author).slice(0, 8) }}
          </span>
        </RouterLink>

        <span v-if="feedMew.original_mew" class="q-ml-md">
          <QBtn
            v-if="showYarnLink"
            flat
            color="dark"
            size="md"
            padding="xs"
            no-caps
            @click.stop.prevent="
              navigateToYarn(feedMew.original_mew.action_hash)
            "
          >
            <div class="q-mr-xs text-secondary text-lowercase">
              {{ reactionLabel }}
            </div>
            <div class="row justify-start items-center">
              <div class="q-pr-xs text-bold">
                {{
                  feedMew.original_mew.author_profile?.fields[
                    PROFILE_FIELDS.DISPLAY_NAME
                  ]
                }}
              </div>
              <div class="q-pr-sm">
                @{{ feedMew.original_mew.author_profile?.nickname }}
              </div>
              <div
                v-if="feedMew.original_mew.deleted_timestamp !== null"
                class="text-bold text-secondary"
              >
                (Deleted Mew)
              </div>
            </div>
          </QBtn>
        </span>

        <QSpace />

        <span class="q-ml-md text-caption">
          <BaseTimestamp :timestamp="feedMew.action.timestamp" />
        </span>
      </div>

      <MewContent
        v-if="(!isDeleted || showIfDeleted) && isMewmew && feedMew.original_mew"
        :mew="feedMew.original_mew.mew as Mew"
        class="q-my-sm cursor-pointer text-left"
      />

      <div
        v-else-if="
          (!isDeleted || showIfDeleted) && isQuote && feedMew.original_mew
        "
      >
        <MewContent :mew="feedMew.mew as Mew" class="q-my-sm cursor-pointer" />

        <div class="row justify-start q-my-md">
          <div class="row items-start">
            <QIcon
              name="svguse:/icons.svg#format-quote-open"
              color="grey-5"
              size="lg"
            />
          </div>
          <div class="bg-grey-2 col">
            <BaseEmbedMew :embed-mew="feedMew.original_mew" />
          </div>
          <div class="row items-end">
            <QIcon
              name="svguse:/icons.svg#format-quote-close"
              color="grey-5"
              size="lg"
            />
          </div>
        </div>
      </div>
      <MewContent
        v-else-if="!isDeleted || showIfDeleted"
        :mew="feedMew.mew as Mew"
        class="q-my-sm cursor-pointer"
      />
      <QBtn
        v-else
        size="sm"
        dense
        flat
        @click.stop.prevent="showIfDeleted = true"
      >
        Show Deleted Mew Content
      </QBtn>

      <div class="row justify-between">
        <div>
          <template v-if="!isDeleted || showIfDeleted">
            <QBtn
              :disable="isUpdatingLick || isDeleted"
              size="sm"
              flat
              @click.stop.prevent="toggleLickMew"
            >
              <QIcon
                name="svguse:/icons.svg#lick"
                :color="isLickedByMe ? 'pink-4' : 'transparent'"
                style="stroke: black"
                class="q-mr-xs"
              />
              {{ feedMew.licks.length }}
              <QTooltip v-if="!isDeleted">
                {{ isLickedByMe ? "Lick" : "Unlick" }} mew
              </QTooltip>
            </QBtn>
            <QBtn
              :disable="isDeleted"
              size="sm"
              icon="reply"
              flat
              @click.stop.prevent="showReplyToMewDialog = true"
            >
              {{ feedMew.replies.length }}
              <QTooltip v-if="!isDeleted">Reply to mew</QTooltip>
            </QBtn>
            <QBtn
              :disable="isDeleted"
              size="sm"
              icon="forward"
              flat
              @click.stop.prevent="createMewmew"
            >
              {{ feedMew.mewmews.length }}
              <QTooltip v-if="!isDeleted">Mewmew mew</QTooltip>
            </QBtn>
            <QBtn
              :disable="isDeleted"
              size="sm"
              icon="format_quote"
              flat
              @click.stop.prevent="showQuoteMewDialog = true"
            >
              {{ feedMew.quotes.length }}
              <QTooltip v-if="!isDeleted">Quote mew</QTooltip>
            </QBtn>
            <QBtn
              v-if="isAuthoredByMe"
              :disable="isDeleted"
              size="sm"
              icon="delete"
              flat
              @click.stop.prevent="showConfirmDeleteDialog = true"
            >
              <QTooltip v-if="!isDeleted">Delete mew</QTooltip>
            </QBtn>
            <QBtn
              :disable="isDeleted && !props.feedMew.is_pinned"
              size="sm"
              flat
              @click.stop.prevent="togglePinMew"
            >
              <QIcon
                v-if="props.feedMew.is_pinned"
                name="svguse:/icons.svg#push-pin-off"
                class="q-mr-xs"
              />
              <QIcon v-else name="svguse:/icons.svg#push-pin" class="q-mr-xs" />
              <QTooltip v-if="!isDeleted">
                {{ props.feedMew.is_pinned ? "Unpin" : "Pin" }} mew
              </QTooltip>
            </QBtn>
          </template>
        </div>
        <div
          v-if="feedMew.deleted_timestamp !== null"
          class="text-red text-bold"
        >
          Deleted <BaseTimestamp :timestamp="feedMew.deleted_timestamp" />
        </div>
      </div>
    </QItemSection>
    <CreateProfileIfNotFoundDialog v-model="showReplyToMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Reply]: feedMew.action_hash }"
        :original-mew="feedMew"
        :original-author="feedMew.original_mew?.author_profile"
        @mew-created="onCreateReply"
      />
    </CreateProfileIfNotFoundDialog>
    <CreateProfileIfNotFoundDialog v-model="showQuoteMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Quote]: feedMew.action_hash }"
        :original-mew="feedMew"
        :original-author="feedMew.original_mew?.author_profile"
        @mew-created="onCreateQuote"
      />
    </CreateProfileIfNotFoundDialog>
    <CreateProfileIfNotFoundDialog
      v-model="showToggleLickMewDialog"
      @profile-created="toggleLickMew"
    />
    <CreateProfileIfNotFoundDialog
      v-model="showCreateMewmewDialog"
      @profile-created="createMewmew"
    />
    <ConfirmDialog
      v-model="showConfirmDeleteDialog"
      title="Delete Mew"
      confirm-text="Delete"
      @confirm="deleteMew"
    >
      <p>Are you sure you want to delete this mew?</p>
      <p>
        Note that other peers may still have copies of the data, and you can't
        force them to delete it.
      </p>
    </ConfirmDialog>
  </QItem>
</template>

<script setup lang="ts">
import { QItemSection, QBtn, QIcon, QTooltip, QSpace } from "quasar";
import { ROUTES } from "@/router";
import { Mew, FeedMew, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { QItem } from "quasar";
import { computed, ComputedRef, inject, ref } from "vue";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";
import CreateMewForm from "./CreateMewForm.vue";
import MewContent from "./MewContent.vue";
import isEqual from "lodash/isEqual";
import remove from "lodash/remove";
import { AgentPubKey } from "@holochain/client";
import { useRouter } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import BaseTimestamp from "./BaseTimestamp.vue";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { showMessage } from "@/utils/notification";
import dayjs from "dayjs";
import BaseEmbedMew from "@/components/BaseEmbedMew.vue";

const props = withDefaults(
  defineProps<{
    feedMew: FeedMew;
    showYarnLink?: boolean;
    showIfDeletedDefault?: boolean;
  }>(),
  {
    showYarnLink: true,
    showIfDeletedDefault: false,
  }
);
const emit = defineEmits([
  "mewmew-created",
  "quote-created",
  "reply-created",
  "mew-licked",
  "mew-unlicked",
  "mew-deleted",
  "mew-pinned",
  "mew-unpinned",
]);
const router = useRouter();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;

const showReplyToMewDialog = ref(false);
const showQuoteMewDialog = ref(false);
const showToggleLickMewDialog = ref(false);
const showCreateMewmewDialog = ref(false);
const showConfirmDeleteDialog = ref(false);
const showIfDeleted = ref(props.showIfDeletedDefault);
const showTogglePinMewDialog = ref(false);
const isUpdatingPin = ref(false);
const isUpdatingLick = ref(false);

const isMewmew = computed(
  () => MewTypeName.Mewmew in props.feedMew.mew.mew_type
);
const isQuote = computed(() => MewTypeName.Quote in props.feedMew.mew.mew_type);
const isReply = computed(() => MewTypeName.Reply in props.feedMew.mew.mew_type);
const reactionLabel = computed(() =>
  isMewmew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
);
const isLickedByMe = computed(() =>
  props.feedMew.licks.some((lick) =>
    isEqual(lick, client.myPubKey as AgentPubKey)
  )
);
const isAuthoredByMe = computed(() =>
  isEqual(client.myPubKey, props.feedMew.action.author)
);
const isDeleted = computed(() => props.feedMew.deleted_timestamp !== null);

const navigateToYarn = (actionHash: ActionHash) => {
  router.push({
    name: ROUTES.yarn,
    params: { hash: encodeHashToBase64(actionHash) },
  });
};

const toggleLickMew = async () => {
  if (!myProfile.value) {
    showToggleLickMewDialog.value = true;
    return;
  }
  showToggleLickMewDialog.value = false;

  isUpdatingLick.value = true;
  const newLicks = props.feedMew.licks;
  if (isLickedByMe.value) {
    await client.callZome({
      role_name: "mewsfeed",
      zome_name: "likes",
      fn_name: "unlike",
      payload: props.feedMew.action_hash,
    });
    remove(newLicks, (l) => isEqual(l, client.myPubKey));
    showMessage("Unlicked Mew");
    emit("mew-unlicked", {
      ...props.feedMew,
      licks: newLicks,
    });
  } else {
    await client.callZome({
      role_name: "mewsfeed",
      zome_name: "likes",
      fn_name: "like",
      payload: props.feedMew.action_hash,
    });
    newLicks.push(client.myPubKey);
    showMessage("Licked Mew");
    emit("mew-licked", {
      ...props.feedMew,
      licks: newLicks,
    });
  }

  isUpdatingLick.value = false;
};

const togglePinMew = async () => {
  if (!myProfile.value) {
    showTogglePinMewDialog.value = true;
    return;
  }
  showTogglePinMewDialog.value = false;

  isUpdatingPin.value = true;
  if (props.feedMew.is_pinned) {
    await client.callZome({
      role_name: "mewsfeed",
      zome_name: "agent_pins",
      fn_name: "unpin_hash",
      payload: props.feedMew.action_hash,
    });
    showMessage("Unpinned Mew");
    emit("mew-unpinned", {
      ...props.feedMew,
      is_pinned: false,
    });
  } else {
    await client.callZome({
      role_name: "mewsfeed",
      zome_name: "agent_pins",
      fn_name: "pin_hash",
      payload: props.feedMew.action_hash,
    });
    showMessage("Pinned Mew");
    emit("mew-pinned", {
      ...props.feedMew,
      is_pinned: true,
    });
  }

  isUpdatingPin.value = false;
};

const createMewmew = async () => {
  if (!myProfile.value) {
    showCreateMewmewDialog.value = true;
    return;
  }
  showCreateMewmewDialog.value = false;

  const originalActionHash =
    MewTypeName.Mewmew in props.feedMew.mew.mew_type
      ? props.feedMew.mew.mew_type[MewTypeName.Mewmew]
      : props.feedMew.action_hash;

  const mew: Mew = {
    mew_type: { [MewTypeName.Mewmew]: originalActionHash },
    text: "",
    links: [],
  };
  const feedMew: FeedMew = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "create_mew_with_context",
    payload: mew,
  });
  emit("mewmew-created", feedMew);
  showMessage("Mewmewed");
};

const onCreateQuote = async (feedMew: FeedMew) => {
  showQuoteMewDialog.value = false;
  emit("quote-created", feedMew);
  showMessage("Quoted mew");
};

const onCreateReply = async (feedMew: FeedMew) => {
  showReplyToMewDialog.value = false;
  emit("reply-created", feedMew);
  showMessage("Replied to mew");
};

const deleteMew = async () => {
  await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "delete_mew",
    payload: props.feedMew.action_hash,
  });
  emit("mew-deleted", {
    ...props.feedMew,
    deleted_timestamp: dayjs().valueOf() * 1000,
  });
  showMessage("Deleted mew");
};
</script>