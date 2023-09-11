import { defineStore } from "pinia";
import { ref } from "vue";

export const useLightboxStore = defineStore("lightbox", () => {
  const lightboxImgSrc = ref();
  const showLightbox = ref(false);

  const openLightbox = (imgSrc: string) => {
    lightboxImgSrc.value = imgSrc;
    showLightbox.value = true;
  };

  const closeLightbox = () => {
    showLightbox.value = false;
  };

  return {
    lightboxImgSrc,
    showLightbox,
    openLightbox,
    closeLightbox,
  };
});
