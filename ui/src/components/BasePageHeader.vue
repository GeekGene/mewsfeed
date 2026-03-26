<template>
  <h1 class="text-2xl font-title font-bold tracking-tighter mb-8 px-4 flex items-center gap-2">
    <VDropdown :triggers="['hover']" :popper-triggers="['hover']" placement="bottom" :distance="8">
      <img
        src="/mewsfeed_logo.png"
        alt="mewsfeed logo"
        class="w-8 h-8 -scale-x-100 cursor-help"
      />
      <template #popper>
        <div class="text-xs p-2">
          v{{ appVersion }} brought to you by the calm cats at
          <a
            href="https://geekgene.com"
            target="_blank"
            rel="noopener"
            class="underline text-primary"
            @click.stop
          >GeekGene</a>
        </div>
      </template>
    </VDropdown>
    <slot>mewsfeed</slot>
  </h1>
</template>

<script setup lang="ts">
declare const __APP_VERSION__: string;
const appVersion = __APP_VERSION__;
</script>
