<template>
  <QBanner class="bg-grey-3" dense rounded>
    <template #avatar>
      <QIcon name="pets" color="accent" />
    </template>
    <div class="text-subtitle1">{{ text }}</div>
  </QBanner>
</template>

<script setup lang="ts">
defineProps({ text: { type: String, default: "Meeow, nothing here yet" } });
</script>
