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
            <MewYarnListItem
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

          <q-list v-if="replies.length" bordered separator>
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
import MewYarnListItem from "@/components/MewYarnListItem.vue";
import { ROUTES } from "@/router";
import { getFeedMewAndContext } from "@/services/clutter-dna";
import { useProfilesStore } from "@/services/profiles-store";
import { FeedMew, MewTypeName } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { pageHeightCorrection } from "@/utils/page-layout";
import { deserializeHash } from "@holochain-open-dev/utils";
import { ActionHash } from "@holochain/client";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const profilesStore = useProfilesStore();

const route = useRoute();

const mew = ref<FeedMew>();
const replies = ref<FeedMew[]>([]);

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
  mew.value = await getFeedMewAndContext(mewHash);
  const replyHashes = mew.value.replies.reverse(); // hashes are in ascending temporal order
  replies.value = await Promise.all(
    replyHashes.map((replyHash) => getFeedMewAndContext(replyHash))
  );
};

onMounted(fetchYarn);

watch(route, (value) => {
  if (value.name === ROUTES.yarn) {
    fetchYarn();
  }
});
</script>
