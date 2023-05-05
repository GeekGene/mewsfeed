<template>
  <QList v-for="i of [0, 1, 2]" :key="i">
    <ProfileSkeleton />

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
  </QList>
</template>

<script setup lang="ts">
import ProfileSkeleton from "./ProfileSkeleton.vue";
</script>
