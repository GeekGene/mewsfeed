<template>
  <QLayout view="hHh lpr fFf">
    <QHeader elevated class="row justify-center">
      <QToolbar class="col-12 col-md-6 col-xl-5">
        <QTabs v-model="tab" dense inline-label class="col-grow">
          <QRouteTab :to="{ name: ROUTES.home }">
            <QIcon name="svguse:/icons.svg#cat" size="lg" />
            <QTooltip>Den</QTooltip>
          </QRouteTab>

          <QBtn
            icon="add"
            color="secondary"
            class="q-mx-md"
            @click="showCreateMewDialog = true"
          >
            Mew
            <QTooltip>Create a mew</QTooltip>
          </QBtn>

          <SearchEverythingInput />

          <QRouteTab
            :to="{ name: ROUTES.feed }"
            icon="feed"
            label="Mews Feed"
          />

          <QRouteTab
            v-if="myProfile && client"
            :to="{ name: ROUTES.myProfile }"
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
      <RouterView :key="routerViewKey" class="col-12 col-md-6 col-xl-5" />
      <QSpace />
    </QPageContainer>

    <CreateProfileIfNotFoundDialog v-model="showCreateMewDialog">
      <CreateMewForm
        :mew-type="{ [MewTypeName.Original]: null }"
        :profiles-store="profilesStore"
        :mew-length-min="dnaProperties.mew_characters_min"
        :mew-length-max="dnaProperties.mew_characters_max"
        @publish-mew="onPublishMew"
      />
    </CreateProfileIfNotFoundDialog>
  </QLayout>
</template>

<script setup lang="ts">
import CreateMewForm from "@/components/CreateMewForm.vue";
import { ROUTES } from "@/router";
import { MewTypeName, MewsfeedDnaProperties } from "@/types/types";
import { AppAgentClient } from "@holochain/client";
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
import { useRouter } from "vue-router";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import CreateProfileIfNotFoundDialog from "@/components/CreateProfileIfNotFoundDialog.vue";
import SearchEverythingInput from "@/components/SearchEverythingInput.vue";

const client = (inject("client") as ComputedRef<AppAgentClient>).value;
const dnaProperties = (
  inject("dnaProperties") as ComputedRef<MewsfeedDnaProperties>
).value;
const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;

const router = useRouter();
const tab = ref("");
const showCreateMewDialog = ref(false);
const routerViewKey = ref(0);

const forceRerenderRouterView = () => {
  routerViewKey.value += 1;
};

const onPublishMew = () => {
  showCreateMewDialog.value = false;
  if (router.currentRoute.value.name === ROUTES.feed) {
    forceRerenderRouterView();
  } else {
    router.push({ name: ROUTES.feed });
  }
};
</script>
