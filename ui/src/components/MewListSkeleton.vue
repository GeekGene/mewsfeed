<template>
  <q-list v-for="i of [0, 1, 2]" :key="i">
    <MewListItemSkeleton />
  </q-list>
</template>

import MewListItemSkeleton from "@/components/MewListItemSkeleton.vue";