<template>
  <QItem>
    <QItemSection avatar>
      <QSkeleton type="QAvatar" />
    </QItemSection>

    <QItemSection>
      <QItemLabel>
        <QSkeleton type="text" />
      </QItemLabel>
      <QItemLabel caption>
        <QSkeleton type="text" width="80%" />
      </QItemLabel>
    </QItemSection>
  </QItem>
</template>
<script setup lang="ts">
import { QItem, QItemSection, QSkeleton, QItemLabel } from "quasar";
</script>
