import { defineStore } from "pinia";
import { ref } from "vue";

export const useNewUserStore = defineStore(
  "newUser",
  () => {
    const isNewUser = ref(true);

    const setNewUser = (status: boolean) => {
      isNewUser.value = status;
    };

    return { isNewUser, setNewUser };
  },
  {
    persist: true,
  }
);
