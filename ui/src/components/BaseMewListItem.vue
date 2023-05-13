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
          <QSkeleton
            v-if="
              loadingOriginalMewAuthor || !originalMew || !originalMewAuthor
            "
            type="text"
            width="4rem"
          />
          <div
            v-else-if="originalMew && originalMew.deleted_timestamp !== null"
            class="row justify-start items-start"
          >
            <span class="q-mr-xs text-secondary">
              {{ reactionLabel }}
            </span>
            <span class="text-secondary">
              <span class="text-bold"> Deleted Mew </span>
            </span>
            <QBtn
              class="q-mx-sm q-px-sm"
              padding="none"
              margin="none"
              flat
              color="dark"
              size="xs"
              @click.stop="navigateToYarn(originalMewHash as Uint8Array)"
            >
              <QIcon
                name="svguse:/icons.svg#yarn"
                size="xs"
                color="secondary"
                flat
              />
              <QTooltip>Original Yarn</QTooltip>
            </QBtn>
          </div>
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
              <QTooltip>Original Yarn</QTooltip>
            </QBtn>
          </div>
        </span>

        <QSpace />

        <span class="q-ml-md text-caption">
          <MewTimestamp :timestamp="feedMew.action.timestamp" />
        </span>
      </div>

      <MewContent
        v-if="!isDeleted || showIfDeleted"
        :feed-mew="originalMew && isMewmew ? originalMew : feedMew"
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
              <QTooltip v-if="!isDeleted">Lick mew</QTooltip>
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
          </template>
        </div>
        <div
          v-if="feedMew.deleted_timestamp !== null"
          class="text-red text-bold"
        >
          Deleted <MewTimestamp :timestamp="feedMew.deleted_timestamp" />
        </div>
      </div>
    </QItemSection>
    <CreateProfileIfNotFoundDialog v-model="showReplyToMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Reply]: feedMew.action_hash }"
        :original-mew="feedMew"
        :original-author="originalMewAuthor"
        @publish-mew="onCreateReply"
      />
    </CreateProfileIfNotFoundDialog>
    <CreateProfileIfNotFoundDialog v-model="showQuoteMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Quote]: feedMew.action_hash }"
        :original-mew="feedMew"
        :original-author="originalMewAuthor"
        @publish-mew="onCreateQuote"
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
import { QItemSection, QSkeleton, QBtn, QIcon, QTooltip, QSpace } from "quasar";
import { ROUTES } from "@/router";
import { Mew, FeedMew, MewTypeName, PROFILE_FIELDS } from "@/types/types";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { QItem } from "quasar";
import { computed, ComputedRef, inject, onMounted, ref } from "vue";
import ProfileAvatarWithPopup from "./ProfileAvatarWithPopup.vue";
import CreateMewForm from "./CreateMewForm.vue";
import MewContent from "./MewContent.vue";
import isEqual from "lodash/isEqual";
import { AgentPubKey, Record } from "@holochain/client";
import { useRouter } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import MewTimestamp from "./MewTimestamp.vue";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { showMessage } from "@/utils/notification";

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
const emit = defineEmits(["publish-mew", "toggle-lick-mew", "delete-mew"]);
const router = useRouter();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;

const agentProfile = ref<Profile>();
const showReplyToMewDialog = ref(false);
const showQuoteMewDialog = ref(false);
const showToggleLickMewDialog = ref(false);
const showCreateMewmewDialog = ref(false);
const showConfirmDeleteDialog = ref(false);
const showIfDeleted = ref(props.showIfDeletedDefault);

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
    isEqual(lick, client.myPubKey as AgentPubKey)
  )
);
const isAuthoredByMe = computed(() =>
  isEqual(client.myPubKey, props.feedMew.action.author)
);
const isDeleted = computed(() => props.feedMew.deleted_timestamp !== null);

onMounted(async () => {
  agentProfile.value = await profilesStore.client.getAgentProfile(
    props.feedMew.action.author
  );

  if (originalMewHash) loadOriginalMew(originalMewHash);
});

const loadOriginalMew = async (actionHash: ActionHash) => {
  originalMew.value = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: actionHash,
  });

  if (!originalMew.value) return;

  // load original mew author
  loadingOriginalMewAuthor.value = true;
  originalMewAuthor.value = await profilesStore.client.getAgentProfile(
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
  if (!myProfile.value) {
    showToggleLickMewDialog.value = true;
    return;
  }
  showToggleLickMewDialog.value = false;

  isUpdatingLick.value = true;
  if (isLickedByMe.value) {
    await client.callZome({
      role_name: "mewsfeed",
      zome_name: "likes",
      fn_name: "unlike",
      payload: props.feedMew.action_hash,
    });
  } else {
    await client.callZome({
      role_name: "mewsfeed",
      zome_name: "likes",
      fn_name: "like",
      payload: props.feedMew.action_hash,
    });
  }
  emit("toggle-lick-mew", props.feedMew.action_hash);
  isUpdatingLick.value = false;
  showMessage("Licked Mew");
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
  const record: Record = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "create_mew",
    payload: mew,
  });
  emit("publish-mew", record.signed_action.hashed.hash);
  showMessage("Mew Mewmewed");
};

const onCreateQuote = async (hash: ActionHash) => {
  showQuoteMewDialog.value = false;
  emit("publish-mew", hash);
  showMessage("Quoted mew");
};

const onCreateReply = async (hash: ActionHash) => {
  showReplyToMewDialog.value = false;
  emit("publish-mew", hash);
  showMessage("Replied to mew");
};

const deleteMew = async () => {
  await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "delete_mew",
    payload: props.feedMew.action_hash,
  });
  emit("delete-mew", props.feedMew.action_hash);
  showMessage("Deleted mew");
};
</script>
