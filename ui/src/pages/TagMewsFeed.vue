<template>
  <QPage :style-fn="pageHeightCorrection">
    <h6 class="q-mt-none q-mb-md">
      Mews with {{ route.meta.tag }}{{ route.params.tag }}
    </h6>

    <MewList
      :mews="data"
      :is-loading="loading"
      @toggle-lick-mew="fetchMew"
      @publish-mew="onPublishmew"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { FeedMew, MewType, MewTypeName } from "@/types/types";
import { showError, showMessage } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { TAG_SYMBOLS } from "@/utils/tags";
import {
  ActionHash,
  AppAgentClient,
  decodeHashFromBase64,
} from "@holochain/client";
import { ComputedRef, inject, watch } from "vue";
import { useRoute } from "vue-router";
import MewList from "@/components/MewList.vue";
import { useRequest } from "vue-request";
import isEqual from "lodash.isequal";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const fetchTagMews = async () => {
  if (route.meta.tag === TAG_SYMBOLS.CASHTAG) {
    return client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_mews_for_cashtag_with_context",
      payload: `${route.meta.tag}${route.params.tag}`,
    });
  } else if (route.meta.tag === TAG_SYMBOLS.HASHTAG) {
    return client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_mews_for_hashtag_with_context",
      payload: `${route.meta.tag}${route.params.tag}`,
    });
  } else if (route.meta.tag === TAG_SYMBOLS.MENTION) {
    return client.callZome({
      role_name: "mewsfeed",
      zome_name: "mews",
      fn_name: "get_mews_for_mention_with_context",
      payload: decodeHashFromBase64(route.params.agentPubKey as string),
    });
  }
};

const { data, loading, error, run } = useRequest(fetchTagMews, {
  initialData: [],
  pollingInterval: 120000, // 120 seconds polling
  refreshOnWindowFocus: true,
  refocusTimespan: 10000, // 10 seconds between window focus to trigger refresh
});
watch(error, showError);

const fetchMew = async (actionHash: ActionHash) => {
  if (data.value === undefined) return;

  const mew: FeedMew = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_mew_with_context",
    payload: actionHash,
  });

  const index = data.value.findIndex((mew: FeedMew) =>
    isEqual(actionHash, mew.action_hash)
  );

  if (index !== -1) {
    // Replace mew if already exists in data
    data.value[index] = mew;
  } else {
    // Insert mew at beginning of list if not
    data.value.unshift(mew);
  }
};

const onPublishmew = async (mewType: MewType) => {
  run();
  showMessage(
    MewTypeName.Reply in mewType
      ? "Replied to mew"
      : MewTypeName.Mewmew in mewType
      ? "Mew mewmewed"
      : "Quoted mew"
  );
};
</script>
