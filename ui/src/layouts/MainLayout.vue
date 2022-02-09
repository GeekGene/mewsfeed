<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      elevated
      class="row justify-center"
    >
      <q-space />
      <q-toolbar class="col col-sm-6 col-lg-5 q-px-none">
        <q-btn
          to="/"
          flat
        >
          <q-icon
            name="svguse:icons.svg#cat"
            size="lg"
            class="q-mr-xs"
          />
          <div>Clutter</div>
        </q-btn>

        <q-space />
        <search-agent
          field-label="Scent fellow"
          clear-on-select
          @agent-selected="onAgentSelect"
        />
        <q-space />

        <q-btn
          to="/feed"
          icon="feed"
          label="Mews"
          flat
        />
        <q-btn
          to="/my-profile"
          flat
        >
          <agent-avatar
            :agent-pub-key="store.myAgentPubKey"
            size="40"
          />
        </q-btn>
      </q-toolbar>
      <q-space />
    </q-header>

    <q-page-container class="row">
      <q-space />
      <router-view class="col col-sm-6 col-lg-5" />
      <q-space />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import "@holochain-open-dev/profiles/search-agent";
import { HoloHashB64 } from "@holochain-open-dev/core-types";
import { useProfileStore } from "../services/profile-store";
import { useRouter } from "vue-router";

const store = useProfileStore();
const router = useRouter();
const onAgentSelect = (payload: { detail: { agentPubKey: HoloHashB64 } }) => {
  router.push(`/profiles/${payload.detail.agentPubKey}`);
};
</script>