<template>
  
  <MewListItemSkeleton v-if="loading"/>
  <template v-else>
    <q-item-section avatar >
      <avatar-with-popup :feed-mew="displayMew" :index="index" />
    </q-item-section>

    <q-item-section >
      <div class="row q-mb-sm">
        <span 
          class="q-mr-xs text-primary text-weight-medium cursor-pointer"
          @click="onAgentClick(router, authorPubKey(displayMew.header.author))"
        >
          {{ displayName }}
        </span>
        <span>@{{ agentProfile?.nickname }}</span>
        <q-space />
        <span v-if="feedMew.mew.mewType.mewMew">mewmew by 
          <router-link :to="`/profiles/${authorPubKey(feedMew.header.author)}`">
            @{{ referencedMewAgentProfile?.nickname }}
          </router-link>
        </span>
        <span v-if="displayMew.mew.mewType.reply && referencedMew">replying to 
          <router-link :to="`/profiles/${authorPubKey(referencedMew.header.author)}`">
            @{{ referencedMewAgentProfile?.nickname }}
          </router-link>
        </span>
        <q-space />
        <q-space />
        <span class="text-caption">
          <Timestamp :timestamp="displayMew.header.timestamp" />
        </span>
      </div>

      <MewContent :feed-mew="displayMew" class="q-mb-xs" />

      <div>
        <q-btn
          size="sm"
          :icon="isLickedByMe ? 'favorite' : 'favorite_border'"
          flat
          @click="toggleLickMew"
        >
          {{ displayMew.licks.length }}
        </q-btn>
        <q-btn size="sm" icon="reply" flat @click="replyToMew">
          {{ displayMew.comments.length }}
        </q-btn>
        <q-btn size="sm" icon="forward" flat @click="mewMew">
          {{ displayMew.mewmews.length }}
        </q-btn>
      </div>
    </q-item-section>

    <create-mew-dialog
      v-if="isReplying"
      :mew-type="{ reply: displayMew.mewEntryHash }"
      @mew-created="onMewCreated"
      @close="isReplying = false"
    >
      <template #title>
        <span class="q-mr-sm">Reply to {{ displayName }}</span>
        <span class="text-secondary">@{{ nickname }}</span>
      </template>
      <template #subtitle>
        <MewContent :feed-mew="displayMew" />
      </template>
    </create-mew-dialog>
  </template>

</template>

<script setup lang="ts">
import { createMew, getFeedMewAndContext, lickMew, unlickMew } from "@/services/clutter-dna";
import { authorPubKey } from "@/utils/hash";
import { isCurrentProfile, onAgentClick } from "@/utils/router"
import { computed, onMounted, ref } from "vue";
import { FeedMew, CreateMewInput } from "../types/types";
import { serializeHash } from "@holochain-open-dev/core-types";
import { PropType } from "vue";
import { useProfileStore } from "@/services/profile-store";
import CreateMewDialog from "./CreateMewDialog.vue";
import MewContent from "./MewContent.vue";
import Timestamp from "./Timestamp.vue";
import AvatarWithPopup from "./AvatarWithPopup.vue";
import { useRouter } from "vue-router";
import MewListItemSkeleton from "@/components/MewListItemSkeleton.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
  index: { type: Number, required: true },
});
const store = useProfileStore();
const loading = ref(true);
const displayMew = ref<FeedMew>(undefined);
const referencedMew = ref<FeedMew>(undefined);
const referencedMewAgentProfile = ref();
const agentProfile = ref();
const displayName = computed(() => agentProfile.value?.fields["Display name"]);
const nickname = computed(() => agentProfile.value?.nickname);
const myAgentPubKey = store.myAgentPubKey;
const router = useRouter();

const emit = defineEmits<{ (e: "refresh-feed"): void }>();

onMounted(async () => {
  loading.value = true
  agentProfile.value = await store.fetchAgentProfile(
    serializeHash(props.feedMew.header.author)
  );
  const mewType: any = props.feedMew.mew.mewType
  displayMew.value = props.feedMew
  if (mewType.reply) {
    referencedMew.value = await getFeedMewAndContext(mewType.reply || mewType.mewMew || mewType.remew)
    referencedMewAgentProfile.value = await store.fetchAgentProfile(
      serializeHash(referencedMew.value.header.author)
    );
  } else if (mewType.mewMew) {
    displayMew.value = await getFeedMewAndContext(mewType.mewMew)
    referencedMewAgentProfile.value = agentProfile.value
    agentProfile.value = await store.fetchAgentProfile(
      serializeHash(displayMew.value.header.author)
    );
  }
  loading.value = false
 });

const isReplying = ref(false);
const isLickedByMe = computed(() =>
  displayMew.value.licks.includes(myAgentPubKey)
);

const toggleLickMew = async () => {
  if (isLickedByMe.value) {
    await unlickMew(displayMew.value.mewEntryHash);
  } else {
    await lickMew(displayMew.value.mewEntryHash);
  }
  emit("refresh-feed");
};

const replyToMew = () => (isReplying.value = true);

const mewMew = async () => {
  const mew: CreateMewInput = {
    mewType: { mewMew: displayMew.value.mewEntryHash },
    text: displayMew.value.mew.content?.text || null,
  };
  await createMew(mew);
  emit("refresh-feed");
};

const onMewCreated = () => (isReplying.value = false);
</script>
