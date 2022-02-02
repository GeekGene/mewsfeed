<template>
  <q-layout view="hHh lpR lFf">
    <q-header
      elevated
      class="row justify-center bg-primary text-white"
    >
      <q-toolbar style="width: 50%;">
        <q-btn
          to="/"
          flat
        >
          <q-avatar class="q-mr-md">
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
    </q-header>

    <q-page-container
      class="q-mx-auto"
      style="width: 50%;"
    >
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>