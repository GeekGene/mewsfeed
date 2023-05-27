<template>
  <QPage :style-fn="pageHeightCorrection">
    <QCard flat>
      <QCardSection class="q-pb-none">
        <QBtn flat @click="router.back()">
          <QIcon
            name="arrow_right_alt"
            size="lg"
            style="transform: rotate(180deg); font-weight: 100"
          />
          Back
        </QBtn>
      </QCardSection>

      <QCardSection class="yarn-container">
        <QList>
          <MewListItem
            :key="forceReloadMewKey"
            v-model="mew"
            class="q-mb-md bg-orange-1"
            :action-hash="actionHash"
            @reply-created="forceReloadAll"
            @mewmew-created="forceReloadAll"
            @quote-created="forceReloadAll"
          />

          <QItem class="q-mb-md q-px-none">
            <div class="col-grow">
              <div class="q-mb-md text-h6 text-medium">Reply</div>

              <CreateMewField
                :mew-type="{ [MewTypeName.Reply]: actionHash }"
                class="full-width"
                @mew-created="onCreateReply"
              />
            </div>
          </QItem>
        </QList>

        <MewList
          :key="forceReloadRepliesKey"
          :fetch-fn="fetchReplies"
          :cache-key="`mews/get_batch_mews_with_context/${mew?.replies}`"
          :show-yarn-link="false"
        />
      </QCardSection>
    </QCard>
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QCard, QCardSection, QBtn, QIcon, QItem, QList } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import MewListItem from "@/components/MewListItem.vue";
import MewList from "@/components/MewList.vue";
import { FeedMew, MewTypeName } from "@/types/types";
import { pageHeightCorrection } from "@/utils/page-layout";
import { decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AppAgentClient } from "@holochain/client";
import isEqual from "lodash/isEqual";
import { showMessage } from "@/utils/notification";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();
const router = useRouter();

const forceReloadRepliesKey = ref(0);
const forceReloadMewKey = ref(0);
const mew = ref<FeedMew>();

const actionHash = computed(() =>
  decodeHashFromBase64(route.params.hash as string)
);

const fetchReplies = () => {
  if (!mew.value?.replies || mew.value.replies.length === 0)
    return Promise.resolve([]);

  return client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_batch_mews_with_context",
    payload: mew.value?.replies,
  });
};

const forceReloadAll = () => {
  forceReloadRepliesKey.value += 1;
  forceReloadMewKey.value += 1;
};

const onCreateReply = () => {
  forceReloadAll();
  showMessage("Replied to Mew");
};

watch(mew, (newMew, oldMew) => {
  if (!oldMew || !isEqual(newMew?.replies, oldMew?.replies))
    forceReloadRepliesKey.value += 1;
});
</script>
