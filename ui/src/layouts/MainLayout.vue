<template>
  <q-layout view="hHh lpR lFf">
    <q-header
      elevated
      class="row bg-primary text-white"
    >
      <q-toolbar class="col-2 text-left">
        <q-toolbar-title class="q-py-sm">
          <q-btn
            to="/"
            flat
          >
            <q-avatar class="q-mr-md">
              <img src="src/assets/img/cat-eating-bird-circle.png">
            </q-avatar>Clutter
          </q-btn>
        </q-toolbar-title>
      </q-toolbar>
      <q-toolbar class="col-10">
        <q-btn
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

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>