<template>
  <div
    class="w-full max-w-screen-md h-full px-3 sm:px-8 py-3 sm:py-6 flex flex-col"
  >
    <div
      class="flex sm:flex-none justify-center items-start space-x-0 sm:space-x-10 h-full"
    >
      <BaseSiteMenu
        class="sticky mt-16 top-8 left-0 hidden sm:block w-14 flex flex-col justify-start items-start space-y-4"
        @click-search="showSearchDialog = true"
      />
      <div class="flex-1 w-full h-full pb-32 sm:pb-16 overflow-hidden relative">
        <RouterView :key="`${route.fullPath}-${forceReloadRouterViewKey}`" />
      </div>
    </div>
  </div>

  <div class="hidden sm:block fixed left-0 bottom-6 w-full">
    <div class="flex justify-center">
      <div class="w-full max-w-screen-md flex items-center space-x-10 px-8">
        <div class="block w-14 h-14"></div>
        <div
          v-if="route.name === ROUTES.feed"
          class="bg-neutral/[0.1] backdrop-blur-md rounded-[2rem] flex-1 w-full"
          style="
            -webkit-backdrop-filter: blur(10px);
            backdrop-filter: blur(10px);
          "
        >
          <CreateMewInput
            :mew-type="MewTypeName.Original"
            @mew-created="onCreateMew"
          />
        </div>
        <div v-else class="flex-1 w-full flex justify-end">
          <button
            class="z-10 btn btn-md btn-neutral rounded-full py-3 flex justify-start items-center"
            @click="
              openCreateMewDialog(MewTypeName.Original, undefined, onCreateMew)
            "
          >
            <IconAdd class="w-6 h-6" />
            <div>Mew</div>
          </button>
        </div>
      </div>
    </div>
  </div>

  <button
    class="block sm:hidden z-10 fixed bottom-32 right-3 btn btn-md btn-neutral rounded-full py-3 flex justify-start items-center"
    @click="openCreateMewDialog(MewTypeName.Original, undefined, onCreateMew)"
  >
    <IconAdd class="w-6 h-6" />
    <div>Mew</div>
  </button>

  <div
    class="flex-0 block sm:hidden fixed bottom-0 bg-base-100 py-8 w-full border-t-2 border-base-300"
  >
    <BaseSiteMenu
      class="w-full flex justify-evenly items-center"
      @click-search="showSearchDialog = true"
    />
  </div>

  <ToastNotices class="z-30" />

  <SearchEverythingDialog v-model="showSearchDialog" />

  <CreateMewDialog
    v-model="showCreateMewDialog"
    :mew-type="createMewDialogType"
    v-bind="createMewDialogProps"
    @mew-created="createMewCompleteCallback"
  />

  <CreateProfileIfNotFoundDialog
    v-if="showCreateProfileDialog"
    v-model="showCreateProfileDialog"
    @profile-created="createProfileCompleteCallback"
  />

  <BaseConfirmDialog
    v-if="showConfirmDialog"
    v-model="showConfirmDialog"
    v-bind="confirmDialogProps"
    @confirm="confirmCallback"
  >
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="confirmDialogHtml"></div>
  </BaseConfirmDialog>

  <VueEasyLightbox
    :visible="showLightbox"
    :imgs="lightboxImgSrc"
    move-disabled
    scroll-disabled
    rotate-disabled
    zoom-disabled
    pinch-disabled
    @hide="closeLightbox"
  >
    <template #toolbar></template>
  </VueEasyLightbox>
</template>

<script setup lang="ts">
import CreateMewInput from "@/components/CreateMewInput.vue";
import BaseSiteMenu from "@/components/BaseSiteMenu.vue";
import SearchEverythingDialog from "@/components/SearchEverythingDialog.vue";
import { ROUTES } from "@/router";
import { FeedMew, MewTypeName } from "@/types/types";
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, computed, inject, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { makeUseNotificationsReadStore } from "@/stores/notificationsRead";
import { setHomeRedirect } from "@/utils/homeRedirect";
import { useInfiniteQuery, useQuery } from "@tanstack/vue-query";
import IconAdd from "~icons/ion/add";
import ToastNotices from "@/components/ToastNotices.vue";
import { useCreateMewDialogStore } from "@/stores/createMewDialog";
import CreateMewDialog from "@/components/CreateMewDialog.vue";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import BaseConfirmDialog from "@/components/BaseConfirmDialog.vue";
import { useCreateProfileDialogStore } from "../stores/createProfileDialog";
import { useConfirmDialogStore } from "../stores/confirmDialog";
import { storeToRefs } from "pinia";
import { useLightboxStore } from "@/stores/lightbox";
import VueEasyLightbox from "vue-easy-lightbox";

const client = (inject("client") as ComputedRef<AppClient>).value;
const router = useRouter();
const route = useRoute();
const useNotificationsReadStore = makeUseNotificationsReadStore(client);
const { setNotificationsCount } = useNotificationsReadStore();
const { openCreateMewDialog, closeCreateMewDialog } = useCreateMewDialogStore();
const {
  createMewDialogType,
  createMewDialogProps,
  showCreateMewDialog,
  createMewCompleteCallback,
} = storeToRefs(useCreateMewDialogStore());
const { createProfileCompleteCallback, showCreateProfileDialog } = storeToRefs(
  useCreateProfileDialogStore()
);
const {
  confirmDialogProps,
  confirmDialogHtml,
  showConfirmDialog,
  confirmCallback,
} = storeToRefs(useConfirmDialogStore());

const { lightboxImgSrc, showLightbox } = storeToRefs(useLightboxStore());
const { closeLightbox } = useLightboxStore();

const showSearchDialog = ref(false);
const forceReloadRouterViewKey = ref(0);
const myPubKeyB64 = computed(() => encodeHashToBase64(client.myPubKey));

const onCreateMew = () => {
  closeCreateMewDialog();
  setHomeRedirect(false);

  if (
    router.currentRoute.value.name === ROUTES.feed ||
    router.currentRoute.value.name === ROUTES.discover
  ) {
    forceReloadRouterViewKey.value += 1;
  } else {
    router.push({ name: ROUTES.feed });
    forceReloadRouterViewKey.value += 1;
  }
};

const fetchMostRecentMew = (): Promise<FeedMew[]> =>
  client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "get_followed_creators_mews_with_context",
    payload: {
      agent: client.myPubKey,
      page: {
        limit: 1,
      },
    },
  });

const { data: mostRecentMew } = useQuery({
  queryKey: [
    "mews",
    "get_followed_creators_mews_with_context",
    myPubKeyB64,
    { page: { limit: 1 } },
  ],
  queryFn: fetchMostRecentMew,
});

watch(mostRecentMew, (val) => {
  if (val && val.length > 0) {
    setHomeRedirect(false);
  }
});

const fetchNotifications = async () => {
  const count: number = await client.callZome({
    role_name: "mewsfeed",
    zome_name: "mews",
    fn_name: "count_notifications_for_agent",
    payload: client.myPubKey,
  });
  setNotificationsCount(count);
  return count;
};

useInfiniteQuery({
  queryKey: ["mews", "count_notifications_for_agent", myPubKeyB64],
  queryFn: fetchNotifications,
  refetchInterval: 1000 * 30, // 30 seconds
  refetchIntervalInBackground: true,
  refetchOnMount: true,
});
</script>
