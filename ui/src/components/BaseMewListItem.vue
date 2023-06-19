<template>
  <div
    class="w-full flex justify-start items-start space-x-4 p-4 cursor-pointer"
    @click.passive="navigateToYarn(feedMew.action_hash)"
  >
    <ProfileAvatarWithPopup :agentPubKey="feedMew.action.author" />

    <div class="w-full">
      <div class="w-full flex justify-between items-center">
        <RouterLink
          :to="{
            name: ROUTES.profile,
            params: { agentPubKey: encodeHashToBase64(feedMew.action.author) },
          }"
          @click.stop.prevent
        >
          <div v-if="feedMew.author_profile" class="flex space-x-2">
            <div
              v-if="feedMew.author_profile.fields[PROFILE_FIELDS.DISPLAY_NAME]"
              class="text-primary font-bold"
            >
              {{ feedMew.author_profile.fields[PROFILE_FIELDS.DISPLAY_NAME] }}
            </div>
            <div class="font-mono">@{{ feedMew.author_profile.nickname }}</div>
          </div>
          <span v-else class="font-mono">
            {{ encodeHashToBase64(feedMew.action.author).slice(0, 8) }}
          </span>
        </RouterLink>

        <div v-if="feedMew.original_mew">
          <RouterLink
            v-if="showYarnLink"
            class="btn btn-cicle btn-sm"
            :to="{
              name: ROUTES.yarn,
              params: {
                actionHash: encodeHashToBase64(
                  feedMew.original_mew.action_hash
                ),
              },
            }"
            @click.stop.prevent
          >
            <div class="text-secondary text-lowercase">
              {{ reactionLabel }}
            </div>
            <div class="flex justify-start items-center">
              <div class="text-bold">
                {{
                  feedMew.original_mew.author_profile?.fields[
                    PROFILE_FIELDS.DISPLAY_NAME
                  ]
                }}
              </div>
              <div>@{{ feedMew.original_mew.author_profile?.nickname }}</div>
              <div
                v-if="feedMew.original_mew.deleted_timestamp !== null"
                class="text-bold text-secondary"
              >
                (Deleted Mew)
              </div>
            </div>
          </RouterLink>
        </div>

        <div class="font-mono text-xs">
          <BaseTimestamp :timestamp="feedMew.action.timestamp" />
        </div>
      </div>

      <BaseMewContent
        v-if="(!isDeleted || showIfDeleted) && isMewmew && feedMew.original_mew"
        :mew="(feedMew.original_mew.mew as Mew)"
        class="my-2"
      />

      <div
        v-else-if="
          (!isDeleted || showIfDeleted) && isQuote && feedMew.original_mew
        "
        class="w-full"
      >
        <BaseMewContent :mew="(feedMew.mew as Mew)" class="my-2" />

        <div class="flex justify-start my-4">
          <div class="flex items-start">
            <IconFormatQuoteOpen class="text-base-300 text-2xl" />
          </div>
          <div class="bg-grey-2 col">
            <BaseEmbedMew :embed-mew="feedMew.original_mew" />
          </div>
          <div class="flex items-end">
            <IconFormatQuoteClose class="text-base-300 text-2xl" />
          </div>
        </div>
      </div>
      <BaseMewContent
        v-else-if="!isDeleted || showIfDeleted"
        :mew="(feedMew.mew as Mew)"
        class="my-2"
      />
      <a v-else class="btn btn-sm" @click.stop.prevent="showIfDeleted = true">
        Show Deleted Mew Content
      </a>

      <div class="flex justify-between">
        <div
          v-if="!isDeleted || showIfDeleted"
          class="flex justify-between items-center"
          style="width: 100%"
        >
          <div class="flex space-x-2">
            <div
              class="tooltip-bottom"
              :class="{ tooltip: !isDeleted }"
              :data-tip="`${isLickedByMe ? 'Unlick' : 'Lick'} mew`"
            >
              <button
                class="btn btn-xs rounded-full btn-ghost flex justify-start items-center space-x-1"
                :disable="isUpdatingLick || isDeleted"
                @click.stop.prevent="toggleLickMew"
              >
                <svg
                  viewBox="0 0 217.65 204.19"
                  class="w-4 h-4 text-black"
                  :class="{ 'text-pink-400': isLickedByMe }"
                >
                  <path
                    fill="currentColor"
                    stroke-width="15"
                    d="M 200.06, 58.29 c 2-12.78-2.74-22.56-12.58-30.34-17.42-13.76-50-13-66.63,1.65 a 10.74,10.74,0,0,0-3.58,7.47 c -2.54,21.55-4.19,43.1-1.78,64.8,1,8.8,1.57,17.66,2,26.51.23,4.46-2.22,7.56-6.64,8.41-4.76.91-8.14-1.29-9.81-5.79a28.22,28.22,0,0,1-1.46-6.08 C 95.93,96.33,95,67.7,99.07,39.08 c .82-5.67-.74-9.57-5.72-12.39 C 74.2,15.87,54.66,14.38,35.2,25.23 c -11.49,6.4-17.74,16.19-17,30.23 a 199.25,199.25,0,0,0,23.7,85.26,111.73,111.73,0,0,0,9.41,14.41 c 31.92,42,84.64,41.94,116.05-.36 C 188.54,126.2,197,93,200.06,58.29 Z"
                  />
                </svg>
                <span v-if="feedMew.licks.length > 0" class="text-xs">
                  {{ feedMew.licks.length }}
                </span>
              </button>
            </div>

            <div
              class="tooltip-bottom"
              :class="{ tooltip: !isDeleted }"
              data-tip="Reply to mew"
            >
              <button
                :disable="isDeleted"
                class="btn btn-xs rounded-full btn-ghost flex justify-start items-center space-x-1"
                @click.stop.prevent="showReplyToMewDialog = true"
              >
                <IconArrowUndoSharp class="w-4 h-4" />
                <span v-if="feedMew.replies.length > 0">
                  {{ feedMew.replies.length }}
                </span>
              </button>
            </div>

            <div
              class="tooltip-bottom"
              :class="{ tooltip: !isDeleted }"
              data-tip="Mewmew mew"
            >
              <button
                :disable="isDeleted"
                class="btn btn-xs rounded-full btn-ghost flex justify-start items-center space-x-1"
                @click.stop.prevent="createMewmew"
              >
                <IconRepeatBold class="w-4 h-4" />
                <span v-if="feedMew.mewmews.length > 0">
                  {{ feedMew.mewmews.length }}
                </span>
              </button>
            </div>

            <div
              class="tooltip-bottom"
              :class="{ tooltip: !isDeleted }"
              data-tip="Quote mew"
            >
              <button
                :disable="isDeleted"
                class="btn btn-xs rounded-full btn-ghost flex justify-start items-center space-x-1"
                @click.stop.prevent="showQuoteMewDialog = true"
              >
                <IconFormatQuote class="w-4 h-4" />
                <span v-if="feedMew.quotes.length > 0">
                  {{ feedMew.quotes.length }}
                </span>
              </button>
            </div>
          </div>
          <div>
            <div
              class="tooltip-bottom"
              :class="{ tooltip: !isDeleted }"
              :data-tip="`${props.feedMew.is_pinned ? 'Unpin' : 'Pin'} mew`"
            >
              <button
                :disable="isDeleted && !props.feedMew.is_pinned"
                class="btn btn-xs rounded-full btn-ghost flex justify-start items-center space-x-1"
                @click.stop.prevent="togglePinMew"
              >
                <IconSharpPinOff
                  v-if="props.feedMew.is_pinned"
                  class="w-4 h-4"
                />
                <IconSharpPushPin v-else class="w-4 h-4" />
              </button>
            </div>
            <div
              v-if="isAuthoredByMe"
              class="tooltip-bottom"
              :class="{ tooltip: !isDeleted }"
              data-tip="Delete mew"
            >
              <button
                :disable="isDeleted"
                class="btn btn-xs rounded-full btn-ghost flex justify-start items-center space-x-1"
                @click.stop.prevent="showConfirmDeleteDialog = true"
              >
                <IconTrashSharp class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="feedMew.deleted_timestamp !== null"
          class="text-red text-bold flex justify-end"
          style="width: 100%"
        >
          <div>
            Deleted <BaseTimestamp :timestamp="feedMew.deleted_timestamp" />
          </div>
        </div>
      </div>
    </div>
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
    <BaseConfirmDialog
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
    </BaseConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import { Mew, FeedMew, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { computed, ComputedRef, inject, ref } from "vue";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";
import CreateMewForm from "./CreateMewForm.vue";
import BaseMewContent from "./BaseMewContent.vue";
import isEqual from "lodash/isEqual";
import remove from "lodash/remove";
import { AgentPubKey } from "@holochain/client";
import { useRouter } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import BaseTimestamp from "./BaseTimestamp.vue";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import BaseConfirmDialog from "@/components/BaseConfirmDialog.vue";
import { showMessage } from "@/utils/toasts";
import dayjs from "dayjs";
import BaseEmbedMew from "@/components/BaseEmbedMew.vue";
import IconFormatQuoteOpen from "~icons/mdi/format-quote-open";
import IconFormatQuoteClose from "~icons/mdi/format-quote-close";
import IconArrowUndoSharp from "~icons/ion/arrow-undo-sharp";
import IconRepeatBold from "~icons/ph/repeat-bold";
import IconFormatQuote from "~icons/material-symbols/format-quote";
import IconTrashSharp from "~icons/ion/trash-sharp";
import IconSharpPinOff from "~icons/ic/sharp-pin-off";
import IconSharpPushPin from "~icons/ic/sharp-push-pin";

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
    params: { actionHash: encodeHashToBase64(actionHash) },
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
