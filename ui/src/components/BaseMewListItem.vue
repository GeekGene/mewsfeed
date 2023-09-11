<template>
  <div
    class="flex flex-col justify-start items-start cursor-pointer"
    @click.passive="navigateToYarn(feedMew.action_hash)"
  >
    <div
      v-if="feedMew.original_mew && showYarnLink"
      class="flex justify-between items-center w-full pt-4 px-4"
    >
      <Component
        :is="enableYarnLink ? 'RouterLink' : 'span'"
        :class="{
          'flex justify-start items-center space-x-1 bg-base-200 font-bold px-2 py-1 text-xs rounded-lg uppercase cursor-default':
            !enableYarnLink,
          'btn btn-xs': enableYarnLink,
        }"
        :to="{
          name: ROUTES.yarn,
          params: {
            actionHash: encodeHashToBase64(feedMew.original_mew.action_hash),
          },
        }"
        @click.stop.prevent
      >
        <div
          :class="{
            'text-primary': enableYarnLink,
          }"
        >
          {{ responseLabel }}
        </div>
        <BaseAgentProfileName
          :profile="feedMew.original_mew.author_profile"
          :agentPubKey="feedMew.original_mew.action.author"
        />

        <div
          v-if="feedMew.original_mew.deleted_timestamp !== null"
          class="text-bold text-primary"
        >
          (Deleted)
        </div>
      </Component>

      <div class="font-mono text-xs">
        <BaseTimestamp :timestamp="feedMew.action.timestamp" />
      </div>
    </div>

    <div class="w-full flex justify-start items-start space-x-4 p-4">
      <BaseAgentProfileLinkAvatar :agentPubKey="feedMew.action.author" />

      <div class="min-w-0 flex-1 w-full break-words">
        <div class="w-full flex justify-between items-center">
          <RouterLink
            :to="{
              name: ROUTES.profile,
              params: {
                agentPubKey: encodeHashToBase64(feedMew.action.author),
              },
            }"
            @click.stop.prevent
          >
            <BaseAgentProfileName
              :profile="feedMew.author_profile"
              :agentPubKey="feedMew.action.author"
            />
          </RouterLink>

          <div v-if="!feedMew.original_mew" class="font-mono text-xs">
            <BaseTimestamp :timestamp="feedMew.action.timestamp" />
          </div>
        </div>

        <div class="my-2 w-full">
          <BaseMewContent
            v-if="
              (!isDeleted || showIfDeleted) && isMewmew && feedMew.original_mew
            "
            :mew="(feedMew.original_mew.mew as Mew)"
            :disable-truncate="disableTruncateContent"
          />

          <div
            v-else-if="
              (!isDeleted || showIfDeleted) && isQuote && feedMew.original_mew
            "
            class="w-full"
          >
            <BaseMewContent
              :mew="(feedMew.mew as Mew)"
              :disable-truncate="disableTruncateContent"
            />

            <div class="flex justify-start my-4">
              <div class="flex items-start">
                <IconFormatQuoteOpen class="text-base-300 text-2xl" />
              </div>
              <div class="min-w-0 flex-1 bg-base-200 p-2 rounded-md">
                <BaseEmbedMew :embed-mew="feedMew.original_mew" />
              </div>
              <div class="flex justify-end items-end">
                <IconFormatQuoteClose class="text-base-300 text-2xl" />
              </div>
            </div>
          </div>

          <div v-else-if="isDeleted" class="w-full">
            <a
              v-if="!showIfDeleted"
              class="btn btn-sm w-full"
              @click.stop.prevent="showIfDeleted = true"
            >
              Show Content
            </a>
            <BaseMewContent
              v-if="showIfDeleted"
              :mew="(feedMew.mew as Mew)"
              :disable-truncate="disableTruncateContent"
            />
          </div>

          <BaseMewContent
            v-else
            :mew="(feedMew.mew as Mew)"
            :disable-truncate="disableTruncateContent"
          />
        </div>

        <div class="flex justify-between">
          <div
            v-if="(!isDeleted || showIfDeleted) && showButtons"
            class="flex justify-between items-center"
            style="width: 100%"
          >
            <div class="flex justify-start items-center space-x-2">
              <button
                v-tooltip.bottom="{
                  disabled: isDeleted,
                  content: 'Reply to mew',
                  popperClass: 'text-xs',
                  triggers: ['hover'],
                }"
                :disable="isDeleted"
                class="flex justify-start items-center space-x-1 p-2"
                :class="{
                  'text-green-400 hover:text-green-600': feedMew.is_replied,
                  'text-base-300 hover:text-neutral': !feedMew.is_replied,
                }"
                @click.stop.prevent="
                  openCreateMewDialog(
                    { [MewTypeName.Reply]: feedMew.action_hash },
                    feedMew,
                    () => {
                      onCreateReply(feedMew);
                    }
                  )
                "
              >
                <IconArrowUndoSharp class="w-4 h-4" />
                <span v-if="feedMew.replies_count > 0">
                  {{ feedMew.replies_count }}
                </span>
              </button>

              <button
                v-tooltip.bottom="{
                  disabled: isDeleted,
                  content: 'Quote mew',
                  popperClass: 'text-xs',
                  triggers: ['hover'],
                }"
                :disable="isDeleted"
                class="flex justify-start items-center space-x-1 p-2"
                :class="{
                  'text-green-400 hover:text-green-600': feedMew.is_quoted,
                  'text-base-300 hover:text-neutral': !feedMew.is_quoted,
                }"
                @click.stop.prevent="
                  openCreateMewDialog(
                    { [MewTypeName.Quote]: feedMew.action_hash },
                    feedMew,
                    () => {
                      onCreateQuote(feedMew);
                    }
                  )
                "
              >
                <IconFormatQuote class="w-4 h-4" />
                <span v-if="feedMew.quotes_count > 0">
                  {{ feedMew.quotes_count }}
                </span>
              </button>

              <button
                v-tooltip.bottom="{
                  disabled: isDeleted,
                  content: 'Mewmew mew',
                  popperClass: 'text-xs',
                  triggers: ['hover'],
                }"
                :disable="isDeleted"
                class="flex justify-start items-center space-x-1 p-2"
                :class="{
                  'text-green-400 cursor-default': feedMew.is_mewmewed,
                  'text-base-300 hover:text-neutral': !feedMew.is_mewmewed,
                }"
                @click.stop.prevent="
                  openCreateMewDialog(
                    { [MewTypeName.Mewmew]: feedMew.action_hash },
                    feedMew,
                    () => {
                      onCreateMewmew(feedMew);
                    }
                  )
                "
              >
                <IconRepeatBold class="w-4 h-4" />
                <div v-if="feedMew.mewmews_count > 0" class="text-xs">
                  {{ feedMew.mewmews_count }}
                </div>
              </button>

              <button
                v-tooltip.bottom="{
                  disabled: isDeleted,
                  content: `${feedMew.is_licked ? 'Unlick' : 'Lick'} mew`,
                  popperClass: 'text-xs',
                  triggers: ['hover'],
                }"
                class="flex justify-start items-center space-x-1 p-2"
                :class="{
                  'text-red-500 hover:text-red-600': feedMew.is_licked,
                  'text-base-300 hover:text-red-500': !feedMew.is_licked,
                }"
                :disable="isUpdatingLick || isDeleted"
                @click.stop.prevent="toggleLickMew"
              >
                <BaseIconTongue class="w-4 h-4" />
                <div v-if="feedMew.licks_count > 0" class="text-xs">
                  {{ feedMew.licks_count }}
                </div>
              </button>
            </div>
            <div class="flex justify-start items-center space-x-2">
              <button
                v-tooltip.bottom="{
                  disabled: isDeleted,
                  content: `${props.feedMew.is_pinned ? 'Unpin' : 'Pin'} mew`,
                  popperClass: 'text-xs',
                  triggers: ['hover'],
                }"
                :disable="isDeleted && !props.feedMew.is_pinned"
                class="flex justify-start items-center space-x-1 p-2"
                :class="{
                  'text-green-400 hover:text-green-600': feedMew.is_pinned,
                  'text-base-300 hover:text-neutral': !feedMew.is_pinned,
                }"
                @click.stop.prevent="togglePinMew"
              >
                <IconSharpPinOff
                  v-if="props.feedMew.is_pinned"
                  class="w-4 h-4"
                />
                <IconSharpPushPin v-else class="w-4 h-4" />
              </button>

              <button
                v-if="isAuthoredByMe"
                v-tooltip.bottom="{
                  disabled: isDeleted,
                  content: 'Delete mew',
                  popperClass: 'text-xs',
                  triggers: ['hover'],
                }"
                :disable="isDeleted"
                class="flex justify-start items-center space-x-1 text-base-300 hover:text-neutral p-2"
                @click.stop.prevent="
                  openConfirmDialog(
                    `<div class='prose'>
                      <b>Are you sure you want to delete this mew?</b>
                      <p>
                        Note that other peers may still have copies of the data,
                        and you can't force them to delete it.
                      </p>
                    </div>`,
                    'Delete Mew',
                    'Delete',
                    deleteMew
                  )
                "
              >
                <IconTrashSharp class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="feedMew.deleted_timestamp !== null"
          class="text-error font-mono flex items-center justify-end w-full space-x-2"
        >
          <div>Deleted</div>
          <BaseTimestamp :timestamp="feedMew.deleted_timestamp" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from "@/router";
import { Mew, FeedMew, MewTypeName } from "@/types/types";
import { Profile } from "@holochain-open-dev/profiles";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { computed, ComputedRef, inject, ref } from "vue";
import BaseAgentProfileLinkAvatar from "@/components/BaseAgentProfileLinkAvatar.vue";
import BaseMewContent from "@/components/BaseMewContent.vue";
import isEqual from "lodash/isEqual";
import { useRouter } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import BaseTimestamp from "@/components/BaseTimestamp.vue";
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
import BaseIconTongue from "@/components/BaseIconTongue.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";
import { useToasts } from "@/stores/toasts";
import { useCreateMewDialogStore } from "@/stores/createMewDialog";
import { useCreateProfileDialogStore } from "@/stores/createProfileDialog";
import { useConfirmDialogStore } from "@/stores/confirmDialog";

const props = withDefaults(
  defineProps<{
    feedMew: FeedMew;
    showYarnLink?: boolean;
    enableYarnLink?: boolean;
    showIfDeletedDefault?: boolean;
    showButtons?: boolean;
    disableTruncateContent?: boolean;
  }>(),
  {
    showYarnLink: true,
    enableYarnLink: true,
    showIfDeletedDefault: false,
    showButtons: true,
    disableTruncateContent: false,
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
const { showMessage, showError } = useToasts();
const { openCreateMewDialog, closeCreateMewDialog } = useCreateMewDialogStore();
const { openCreateProfileDialog } = useCreateProfileDialogStore();
const { openConfirmDialog } = useConfirmDialogStore();

const showIfDeleted = ref(props.showIfDeletedDefault);
const isUpdatingPin = ref(false);
const isUpdatingLick = ref(false);

const isMewmew = computed(
  () => MewTypeName.Mewmew in props.feedMew.mew.mew_type
);
const isQuote = computed(() => MewTypeName.Quote in props.feedMew.mew.mew_type);
const isReply = computed(() => MewTypeName.Reply in props.feedMew.mew.mew_type);
const responseLabel = computed(() =>
  isMewmew.value ? "mewmewed from" : isReply.value ? "replied to" : "quoted"
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
    openCreateProfileDialog(toggleLickMew);
    return;
  }

  isUpdatingLick.value = true;
  if (props.feedMew.is_licked) {
    try {
      await client.callZome({
        role_name: "mewsfeed",
        zome_name: "likes",
        fn_name: "unlike",
        payload: props.feedMew.action_hash,
      });
      showMessage("Unlicked Mew");
      emit("mew-unlicked", {
        ...props.feedMew,
        licks_count: props.feedMew.licks_count - 1,
      });
    } catch (e) {
      showError(e);
    }
  } else {
    try {
      await client.callZome({
        role_name: "mewsfeed",
        zome_name: "likes",
        fn_name: "like",
        payload: props.feedMew.action_hash,
      });
      showMessage("Licked Mew");
      emit("mew-licked", {
        ...props.feedMew,
        licks_count: props.feedMew.licks_count + 1,
      });
    } catch (e) {
      showError(e);
    }
  }

  isUpdatingLick.value = false;
};

const togglePinMew = async () => {
  if (!myProfile.value) {
    openCreateProfileDialog(togglePinMew);
    return;
  }

  isUpdatingPin.value = true;
  if (props.feedMew.is_pinned) {
    try {
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
    } catch (e) {
      showError(e);
    }
  } else {
    try {
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
    } catch (e) {
      showError(e);
    }
  }

  isUpdatingPin.value = false;
};

const onCreateMewmew = async (feedMew: FeedMew) => {
  closeCreateMewDialog();
  emit("mewmew-created", feedMew);
  showMessage("Mewmewed");
};

const onCreateQuote = async (feedMew: FeedMew) => {
  closeCreateMewDialog();
  emit("quote-created", feedMew);
  showMessage("Quoted mew");
};

const onCreateReply = async (feedMew: FeedMew) => {
  closeCreateMewDialog();
  emit("reply-created", feedMew);
  showMessage("Replied to mew");
};

const deleteMew = async () => {
  try {
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
  } catch (e) {
    showError(e);
  }
};
</script>
