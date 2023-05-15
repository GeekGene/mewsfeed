<template>
  <QLayout view="hHh lpr fFf">
    <QHeader elevated class="row justify-center">
      <QToolbar class="col-12 col-md-6 col-xl-5">
        <QTabs v-model="tab" dense inline-label class="col-grow">
          <QRouteTab :to="{ name: ROUTES.feed }">
            <QIcon name="svguse:/icons.svg#cat" size="lg" />
          </QRouteTab>
          <QRouteTab :to="{ name: ROUTES.discover }" icon="explore" />

          <SearchEverythingInput />

          <QBtn
            icon="add"
            color="secondary"
            class="q-mx-md"
            @click="showCreateMewDialog = true"
          >
            Mew
            <QTooltip>Create a mew</QTooltip>
          </QBtn>

          <QRouteTab
            v-if="myProfile && client"
            :to="{
              name: ROUTES.profile,
              params: { agent: encodeHashToBase64(client.myPubKey) },
            }"
          >
            <agent-avatar
              :agentPubKey="client.myPubKey"
              size="40"
              disable-tooltip
              disable-copy
            />
            <QTooltip>Your profile</QTooltip>
          </QRouteTab>
        </QTabs>
      </QToolbar>
    </QHeader>

    <QPageContainer class="row q-mt-xl bg-white">
      <QSpace />
      <RouterView
        :key="`${route.fullPath}-${forceReloadRouterViewKey}`"
        class="col-12 col-md-6 col-xl-5"
      />
      <QSpace />
    </QPageContainer>

    <CreateProfileIfNotFoundDialog v-model="showCreateMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Original]: null }"
        :profiles-store="profilesStore"
        :mew-length-min="dnaProperties.mew_characters_min"
        :mew-length-max="dnaProperties.mew_characters_max"
        @mew-created="onCreateMew"
      />
    </CreateProfileIfNotFoundDialog>
  </QLayout>
</template>

<script setup lang="ts">
import CreateMewForm from "@/components/CreateMewForm.vue";
import { ROUTES } from "@/router";
import { MewTypeName, MewsfeedDnaProperties } from "@/types/types";
import { AppAgentClient, encodeHashToBase64 } from "@holochain/client";
import {
  QPageContainer,
  QSpace,
  QRouteTab,
  QTabs,
  QBtn,
  QLayout,
  QHeader,
  QToolbar,
  QTooltip,
  QIcon,
} from "quasar";
import { ComputedRef, inject, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import SearchEverythingInput from "@/components/SearchEverythingInput.vue";
import { showMessage } from "@/utils/notification";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const dnaProperties = (
  inject("dnaProperties") as ComputedRef<MewsfeedDnaProperties>
).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const router = useRouter();
const route = useRoute();

const tab = ref("");
const showCreateMewDialog = ref(false);
const forceReloadRouterViewKey = ref(0);

const onCreateMew = () => {
  showCreateMewDialog.value = false;
  showMessage("Published Mew");
  if (router.currentRoute.value.name === ROUTES.feed) {
    forceReloadRouterViewKey.value += 1;
  } else {
    router.push({ name: ROUTES.feed });
  }
};
</script>
