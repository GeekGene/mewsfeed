<template>
  <q-layout view="hHh lpR lFf">
    <q-header
      elevated
      class="row justify-center bg-primary text-white"
    >
      <q-space />
      <q-toolbar class="col col-sm-6 col-lg-5 q-px-none">
        <q-btn
          to="/"
          flat
        >
          <q-avatar class="q-mr-xs">
            <img src="src/assets/img/cat-eating-bird-circle.png">
          </q-avatar>Clutter
        </q-btn>

        <q-space />

        <q-btn
          to="/feed"
          icon="feed"
          flat
        >
          Mews
        </q-btn>
        <q-btn
          to="/profile"
          icon="person"
          flat
        >
          Profile
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
</script>