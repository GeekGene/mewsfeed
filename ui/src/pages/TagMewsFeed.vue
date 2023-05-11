<template>
  <QPage :style-fn="pageHeightCorrection">
    <h6 class="q-mt-none q-mb-md">
      Mews with {{ route.meta.tag }}{{ route.params.tag }}
    </h6>

    <MewList
      :mews="mews"
      :is-loading="isLoading"
      @toggle-lick-mew="onToggleLickMew"
      @publish-mew="onPublishmew"
    />
  </QPage>
</template>

<script setup lang="ts">
import { QPage } from "quasar";
import { FeedMew, MewType, MewTypeName } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError, showMessage } from "@/utils/notification";
import { pageHeightCorrection } from "@/utils/page-layout";
import { TAG_SYMBOLS } from "@/utils/tags";
import {
  ActionHash,
  AppAgentClient,
  decodeHashFromBase64,
} from "@holochain/client";
import { ComputedRef, inject, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import MewList from "../components/MewList.vue";

const route = useRoute();
const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const mews = ref<FeedMew[]>([]);
const isLoading = ref(false);

const loadMewsFeed = async () => {
  try {
    isLoading.value = true;
    if (route.meta.tag === TAG_SYMBOLS.CASHTAG) {
      mews.value = await client.callZome({
        role_name: "mewsfeed",
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: `${route.meta.tag}${route.params.tag}`,
      });
    } else if (route.meta.tag === TAG_SYMBOLS.HASHTAG) {
      mews.value = await client.callZome({
        role_name: "mewsfeed",
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: `${route.meta.tag}${route.params.tag}`,
      });
    } else if (route.meta.tag === TAG_SYMBOLS.MENTION) {
      mews.value = await client.callZome({
        role_name: "mewsfeed",
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: decodeHashFromBase64(route.params.agentPubKey as string),
      });
    }
  } catch (error) {
    showError(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadMewsFeed);
watch(route, () => {
  loadMewsFeed();
});

const onToggleLickMew = async (hash: ActionHash) => {
  try {
    const index = mews.value.findIndex((mew) =>
      isSameHash(hash, mew.action_hash)
    );
    if (index !== -1) {
      mews.value[index] = await client.callZome({
        role_name: "mewsfeed",
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: hash,
      });
    }
  } catch (error) {
    showError(error);
  }
};

const onPublishmew = async (mewType: MewType) => {
  loadMewsFeed();
  showMessage(
    MewTypeName.Reply in mewType
      ? "Replied to mew"
      : MewTypeName.Mewmew in mewType
      ? "Mew mewmewed"
      : "Quoted mew"
  );
};
</script>
