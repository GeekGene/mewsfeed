<template>
  <div class="h-full w-full text-base-content font-content font-normal">
    <div class="flex space-x-6 h-full p-4">
      <IconPersonCircle class="text-base-300 w-20 h-20 p-0 m-0" />

      <div class="w-full flex flex-col space-y-8">
        <div class="flex-1 flex justify-between items-start">
          <div class="flex flex-col space-y-2">
            <div class="h-2.5 bg-base-300 rounded-full w-48"></div>
            <div class="h-2.5 bg-base-300 rounded-full w-32"></div>
          </div>

          <div class="bg-base-300 rounded-2xl w-32 h-8"></div>
        </div>
        <div class="flex flex-col w-full space-y-2 my-4">
          <div class="h-1.5 bg-base-200 rounded-full w-5/6"></div>
          <div class="h-1.5 bg-base-200 rounded-full w-3/4"></div>
          <div class="h-1.5 bg-base-200 rounded-full w-5/6"></div>
          <div class="h-1.5 bg-base-200 rounded-full w-3/4"></div>
        </div>

        <div class="flex justify-start items-center space-x-12">
          <div class="flex justify-start items-center space-x-2">
            <div class="bg-base-300 rounded-full w-4 h-4"></div>
            <div class="h-3 bg-base-300 rounded-full w-24"></div>
          </div>
          <div class="flex justify-start items-center space-x-2">
            <div class="bg-base-300 rounded-full w-4 h-4"></div>
            <div class="h-3 bg-base-300 rounded-full w-24"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconPersonCircle from "~icons/ion/person-circle";
</script>
