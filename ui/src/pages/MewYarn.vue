<template>
  <QPage :style-fn="pageHeightCorrection">
    <QCard flat>
      <QCardSection class="q-pb-none">
        <QBtn flat @click="$router.back()">
          <QIcon
            name="arrow_right_alt"
            size="lg"
            style="transform: rotate(180deg); font-weight: 100"
          />
          Back
        </QBtn>
      </QCardSection>

      <QCardSection v-if="mew" class="yarn-container">
        <profiles-context :store="profilesStore">
          <QList>
            <MewListItemSkeleton v-if="isLoadingMew" />
            <MewListItem
              v-else
              :feed-mew="mew"
              class="q-mb-md bg-orange-1"
              @publish-mew="onPublishMew"
              @toggle-lick-mew="onToggleLickMew"
            />

            <QItem class="q-mb-md q-px-none">
              <div class="col-grow">
                <div class="q-mb-md text-h6 text-medium">Reply</div>

                <profiles-context :store="profilesStore">
                  <CreateMewField
                    :mew-type="{ [MewTypeName.Reply]: mew.action_hash }"
                    class="full-width"
                    @publish-mew="onPublishMew"
                  />
                </profiles-context>
              </div>
            </QItem>
          </QList>

          <MewListSkeleton v-if="isLoadingReplies" />
          <QList v-else-if="replies.length" bordered separator>
            <MewListItem
              v-for="(reply, i) of replies"
              :key="i"
              :feed-mew="reply"
              :show-yarn-link="false"
              @publish-mew="onPublishMew"
              @toggle-lick-mew="onToggleLickMew"
            />
          </QList>
        </profiles-context>
      </QCardSection>
    </QCard>
  </QPage>
</template>

<script setup lang="ts">
import { QPage, QCard, QCardSection, QBtn, QIcon, QItem, QList } from "quasar";
import CreateMewField from "@/components/CreateMewField.vue";
import MewListItemSkeleton from "@/components/MewListItemSkeleton.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import MewListItem from "@/components/MewListItem.vue";
import { ROUTES } from "@/router";
import { FeedMew, MewTypeName } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash, decodeHashFromBase64 } from "@holochain/client";
import { ComputedRef, inject, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { AppAgentClient } from "@holochain/client/lib/api/app-agent/types";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const route = useRoute();

const mew = ref<FeedMew>();
const isLoadingMew = ref(false);
const replies = ref<FeedMew[]>([]);
const isLoadingReplies = ref(false);

const onToggleLickMew = async (mewHash: ActionHash) => {
  const feedMew = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: mewHash,
  });
  const replyIndex = replies.value.findIndex((r) =>
    isSameHash(r.action_hash, mewHash)
  );
  if (replyIndex === -1) {
    mew.value = feedMew;
  } else {
    replies.value[replyIndex] = feedMew;
  }
};

const loadMew = async () => {
  const mewHash = decodeHashFromBase64(route.params.hash as string);
  try {
    isLoadingMew.value = true;
    mew.value = await client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_mew_with_context",
      payload: mewHash,
    });
  } catch (error) {
    showError(error);
  } finally {
    isLoadingMew.value = false;
  }
};

const loadReplies = async () => {
  try {
    isLoadingReplies.value = true;
    const replyHashes = mew.value?.replies;
    if (!replyHashes) {
      return;
    }
    replies.value = await Promise.all(
      replyHashes.map((replyHash) =>
        client.callZome({
          role_name: "mewsfeed",
          zome_name: "mews",
          fn_name: "get_mew_with_context",
          payload: replyHash,
        })
      )
    );
  } catch (error) {
    showError(error);
  } finally {
    isLoadingReplies.value = false;
  }
};

const loadYarn = async () => {
  await loadMew();
  loadReplies();
};

onMounted(loadYarn);

watch(route, (value) => {
  if (value.name === ROUTES.yarn) {
    loadYarn();
  }
});

const onPublishMew = async () => loadYarn();
</script>
