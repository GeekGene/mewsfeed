<template>
  <div class="dropdown dropdown-hover dropdown-bottom dropdown-end">
    <label tabindex="0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 256 256"
      >
        <path
          fill="currentColor"
          d="M228.2 153L209 100.3a16 16 0 0 0-20.5-9.5l-59.9 21.8l11-62.8a16 16 0 0 0-2.6-12a16.2 16.2 0 0 0-10.3-6.6l-55.2-9.7a16.1 16.1 0 0 0-18.5 13L28.8 171.7a45 45 0 0 0 7.7 33.9a43.4 43.4 0 0 0 28.7 17.9a51.6 51.6 0 0 0 6.7.5H212a16 16 0 0 0 16-16v-43.7a15.7 15.7 0 0 0 .2-11.3ZM72 192a12 12 0 1 1 12-12a12 12 0 0 1-12 12Zm140 16h-88.3l88.3-32.1Zm-98.5-13.3a41 41 0 0 0 1.8-7.1l10.1-56.8l68.6-25l19.1 52.6Z"
        />
      </svg>
    </label>
    <ul
      tabindex="0"
      class="dropdown-content menu z-40 px-0 shadow-md bg-base-100 text-base-content rounded-box max-h-64 overflow-scroll flex-nowrap"
    >
      <li
        v-for="theme in store.themesDisplay"
        :key="theme.name"
        class="text-xs w-full"
        :value="theme.name"
      >
        <a
          class="w-full py-2 px-8 capitalize"
          :class="{ 'bg-base-300': theme.active }"
          @click="(e: any) => store.set(theme.name)"
        >
          {{ theme.name }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useThemeStore } from "../stores/theme";

const store = useThemeStore();
</script>
