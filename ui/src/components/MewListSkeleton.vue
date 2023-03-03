<template>
  <q-list v-for="i of [0, 1, 2]" :key="i">
    <ProfileSkeleton />

    <q-item>
      <q-item-section avatar />

      <q-item-section>
        <q-skeleton height="50px" class="q-mb-sm" />

        <div class="row items-center">
          <div class="row items-center">
            <q-icon
              name="chat_bubble_outline"
              color="grey-4"
              class="q-mr-sm"
              size="18px"
            />
            <q-skeleton type="text" width="30px" />
          </div>

          <div class="row items-center">
            <q-icon name="repeat" color="grey-4" class="q-mr-sm" size="18px" />
            <q-skeleton type="text" width="30px" />
          </div>

          <div class="row items-center">
            <q-icon
              name="favorite_border"
              color="grey-4"
              class="q-mr-sm"
              size="18px"
            />
            <q-skeleton type="text" width="30px" />
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import ProfileSkeleton from "./ProfileSkeleton.vue";
</script>
