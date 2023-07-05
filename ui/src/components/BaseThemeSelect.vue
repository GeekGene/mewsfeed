<template>
  <div class="dropdown dropdown-bottom dropdown-end w-full">
    <label ref="button" tabindex="0">
      <button
        class="btn btn-xs sm:btn-sm btn-neutral rounded-3xl flex justify-center items-center w-full"
      >
        <IconSwatchesFill />
        <div>Switch Theme</div>
      </button>
    </label>
    <ul
      tabindex="0"
      class="dropdown-content w-full menu z-10 px-0 shadow-md bg-base-100 text-netural-content rounded-box max-h-64 overflow-scroll flex-nowrap"
    >
      <li
        v-for="theme in store.themesDisplay"
        :key="theme.name"
        class="text-xs w-full"
        :value="theme.name"
        @click="(e: any) => store.set(theme.name)"
      >
        <a
          class="w-full py-2 px-8 capitalize"
          :class="{ 'bg-base-300': theme.active }"
        >
          {{ theme.name }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useThemeStore } from "../stores/theme";
import IconSwatchesFill from "~icons/ph/swatches-fill";

const store = useThemeStore();

const button = ref();
</script>
