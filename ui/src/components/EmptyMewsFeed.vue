<template>
  <q-banner class="bg-grey-3" dense rounded>
    <template #avatar>
      <q-icon name="pets" color="accent" />
    </template>
    <div class="text-subtitle1">{{ text }}</div>
  </q-banner>
</template>

<script setup lang="ts">
defineProps({ text: { type: String, default: "Meeow, nothing here yet" } });
</script>
