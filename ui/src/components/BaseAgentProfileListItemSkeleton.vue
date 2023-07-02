<template>
  <div>
    <div class="flex items-center mt-4 space-x-3">
      <IconPersonCircleOutline
        class="text-base-300 fill-base-300 stroke-base-300 w-14 h-14 p-0 m-0"
      />

      <div>
        <div class="flex items-center w-full space-x-2 mb-2">
          <div class="h-2.5 bg-gray-300 rounded-full w-32"></div>
          <div class="h-2.5 bg-gray-200 rounded-full w-24"></div>
        </div>

        <div class="w-full flex flex-col space-y-1">
          <div class="w-full h-2 bg-gray-100 rounded-full"></div>
          <div class="w-full h-2 bg-gray-100 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import IconPersonCircleOutline from "~icons/ion/person-circle-outline";
</script>
