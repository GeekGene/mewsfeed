<template>
  <QList v-for="i of [0, 1, 2]" :key="i">
    <BaseProfileSkeleton />

    <QItem>
      <QItemSection avatar />

      <QItemSection>
        <QSkeleton height="50px" class="q-mb-sm" />

        <div class="row items-center">
          <div class="row items-center">
            <QIcon
              name="svguse:/icons.svg#lick"
              color="grey-4"
              class="q-mr-xs"
            />
            <QSkeleton type="text" width="30px" />
          </div>
          <div class="row items-center">
            <QIcon name="reply" color="grey-4" class="q-mr-sm" size="18px" />
            <QSkeleton type="text" width="30px" />
          </div>
          <div class="row items-center">
            <QIcon name="forward" color="grey-4" class="q-mr-sm" size="18px" />
            <QSkeleton type="text" width="30px" />
          </div>
          <div class="row items-center">
            <QIcon
              name="format_quote"
              color="grey-4"
              class="q-mr-sm"
              size="18px"
            />
            <QSkeleton type="text" width="30px" />
          </div>
        </div>
      </QItemSection>
    </QItem>
  </QList>
</template>

<script setup lang="ts">
import { QList, QItem, QItemSection, QSkeleton, QIcon } from "quasar";
import BaseProfileSkeleton from "./BaseProfileSkeleton.vue";
</script>
