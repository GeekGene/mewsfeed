<template>
  <div>
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
  </div>
</template>
<script setup lang="ts">
import { QItemSection, QSkeleton, QItemLabel } from "quasar";
</script>
