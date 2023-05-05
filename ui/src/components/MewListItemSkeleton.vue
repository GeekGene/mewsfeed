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

  <QItem>
    <QItemSection avatar />

    <QItemSection>
      <QSkeleton height="50px" class="q-mb-sm" />

      <div class="row items-center">
        <div class="row items-center">
          <QIcon
            name="chat_bubble_outline"
            color="grey-4"
            class="q-mr-sm"
            size="18px"
          />
          <QSkeleton type="text" width="30px" />
        </div>

        <div class="row items-center">
          <QIcon name="repeat" color="grey-4" class="q-mr-sm" size="18px" />
          <QSkeleton type="text" width="30px" />
        </div>

        <div class="row items-center">
          <QIcon
            name="favorite_border"
            color="grey-4"
            class="q-mr-sm"
            size="18px"
          />
          <QSkeleton type="text" width="30px" />
        </div>
      </div>
    </QItemSection>
  </QItem>
</template>

<script setup lang="ts">
import { QItem, QItemSection, QSkeleton, QIcon } from "quasar";
</script>
