<template>
  <q-page :style-fn="pageHeightCorrection">
    <q-card flat>
      <q-card-section class="q-pb-none">
        <q-btn flat @click="$router.back()">
          <q-icon
            name="arrow_right_alt"
            size="lg"
            style="transform: rotate(180deg); font-weight: 100"
          />
          Back
        </q-btn>
      </q-card-section>

      <q-card-section v-if="mew" class="yarn-container">
        <profiles-context :store="profilesStore">
          <q-list>
            <MewListItemSkeleton v-if="isLoadingMew" />
            <MewListItem
              v-else
              :feed-mew="mew"
              :on-publish-mew="onPublishMew"
              :on-toggle-lick-mew="onToggleLickMew"
              class="q-mb-md bg-orange-1"
            />

            <q-item class="q-mb-md q-px-none">
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
            </q-item>
          </q-list>

          <MewListSkeleton v-if="isLoadingReplies" />
          <q-list v-else-if="replies.length" bordered separator>
            <MewListItem
              v-for="(reply, i) of replies"
              :key="i"
              :feed-mew="reply"
              :on-publish-mew="onPublishMew"
              :on-toggle-lick-mew="onToggleLickMew"
              :show-yarn-link="false"
            />
          </q-list>
        </profiles-context>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import CreateMewField from "@/components/CreateMewField.vue";
import MewListItemSkeleton from "@/components/MewListItemSkeleton.vue";
import MewListSkeleton from "@/components/MewListSkeleton.vue";
import MewListItem from "@/components/MewListItem.vue";
import { ROUTES } from "@/router";
import { getFeedMewAndContext } from "@/services/mewsfeed-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { FeedMew, MewTypeName } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { ActionHash, decodeHashFromBase64 } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const profilesStore = useProfilesStore();

const route = useRoute();

const mew = ref<FeedMew>();
const isLoadingMew = ref(false);
const replies = ref<FeedMew[]>([]);
const isLoadingReplies = ref(false);

const onToggleLickMew = async (mewHash: ActionHash) => {
  const feedMew = await getFeedMewAndContext(mewHash);
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
    mew.value = await getFeedMewAndContext(mewHash);
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
      replyHashes.map((replyHash) => getFeedMewAndContext(replyHash))
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
