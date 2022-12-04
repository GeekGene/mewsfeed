<template>
  <q-page :style-fn="pageHeightCorrection">
    <q-card>
      <q-card-section class="q-pb-none">
        <q-btn flat @click="$router.go(-1)">
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
            <MewYarnListItem
              v-else
              :feed-mew="mew"
              :on-publish-mew="onPublishMew"
              class="q-mb-md bg-orange-1"
              @mew-licked="onMewLicked"
            />

            <q-item class="q-mb-md q-px-none">
              <div class="col-grow">
                <div class="text-h6 text-medium">Reply</div>

                <profiles-context :store="profilesStore">
                  <CreateMewField
                    :mew-type="{ [MewTypeName.Reply]: mew.actionHash }"
                    class="full-width"
                    @publish-mew="onPublishMew"
                  />
                </profiles-context>
              </div>
            </q-item>
          </q-list>

          <MewListSkeleton v-if="isLoadingReplies" />
          <q-list v-else-if="replies.length" bordered separator>
            <MewYarnListItem
              v-for="(reply, index) of replies"
              :key="index"
              :feed-mew="reply"
              :on-publish-mew="onPublishMew"
              :content-inset-level="1"
              @mew-licked="onMewLicked"
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
import MewYarnListItem from "@/components/MewYarnListItem.vue";
import { ROUTES } from "@/router";
import { getFeedMewAndContext } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { FeedMew, MewTypeName } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { deserializeHash } from "@holochain-open-dev/utils";
import { ActionHash } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const profilesStore = useProfilesStore();

const route = useRoute();

const mew = ref<FeedMew>();
const isLoadingMew = ref(false);
const replies = ref<FeedMew[]>([]);
const isLoadingReplies = ref(false);

const onMewLicked = async (mewHash: ActionHash) => {
  const replyIndex = replies.value.findIndex((r) =>
    isSameHash(r.actionHash, mewHash)
  );
  if (replyIndex !== -1) {
    const mew = await getFeedMewAndContext(mewHash);
    replies.value[replyIndex] = mew;
  }
};

const onPublishMew = async () => fetchYarn();

const getMewHashFromRoute = () =>
  deserializeHash(
    typeof route.params.hash === "string"
      ? route.params.hash
      : route.params.hash[0]
  );

const fetchYarn = async () => {
  const mewHash = getMewHashFromRoute();
  try {
    isLoadingMew.value = true;
    mew.value = await getFeedMewAndContext(mewHash);
  } catch (error) {
    showError(error);
  } finally {
    isLoadingMew.value = false;
  }

  try {
    isLoadingReplies.value = true;
    const replyHashes = mew.value?.replies.reverse(); // hashes are in ascending temporal order
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

onMounted(fetchYarn);

watch(route, (value) => {
  if (value.name === ROUTES.yarn) {
    fetchYarn();
  }
});
</script>
