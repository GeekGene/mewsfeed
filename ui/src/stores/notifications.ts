import {
  AppAgentClient,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRequest } from "vue-request";
import { Notification } from "@/types/types";
import { encode, decode } from "@msgpack/msgpack";
import { PersistedStateOptions } from "pinia-plugin-persistedstate";

const notificationToKey = (notification: Notification) => {
  const keyObj = {
    notificationType: notification.notification_type,
    timestamp: notification.timestamp,
    agentPubKeyB64: notification.agent,
    mewActionHash: notification.feed_mew
      ? notification.feed_mew.action_hash
      : null,
  };

  return encodeHashToBase64(encode(keyObj));
};

export const makeUseNotificationsStore = (client: AppAgentClient) =>
  defineStore(
    "notifications",
    () => {
      const allNotifications = ref<{
        [key: string]: { notification: Notification; read: boolean };
      }>({});
      const notificationKeys = ref<string[]>([]);
      const unreadCount = computed(
        () =>
          Object.values(allNotifications.value).filter((n) => !n.read).length
      );
      const notifications = computed(() =>
        notificationKeys.value.map(
          (key) => allNotifications.value[key].notification
        )
      );

      const fetchNotifications = (): Promise<Notification[]> =>
        client.callZome({
          role_name: "mewsfeed",
          zome_name: "mews",
          fn_name: "get_my_notifications",
          payload: null,
        });

      const { loading, error, runAsync } = useRequest(fetchNotifications, {
        cacheKey: `mews/get_my_notifications`,
        pollingInterval: 30 * 1000, // 30 seconds polling
        refreshOnWindowFocus: true,
        refocusTimespan: 0, // 0 seconds between window focus to trigger refresh
        loadingDelay: 1000,
        onSuccess: (data) => {
          data.map((notification: Notification) => {
            const key = notificationToKey(notification);

            if (!notificationKeys.value.includes(key)) {
              notificationKeys.value.push(key);
              allNotifications.value[key] = { notification, read: false };
            }
          });
        },
      });

      function markRead(notification: Notification) {
        const key = notificationToKey(notification);
        allNotifications.value[key].read = true;
      }

      return {
        notificationKeys,
        allNotifications,
        notifications,
        unreadCount,
        loading,
        error,
        markRead,
        runAsync,
      };
    },
    {
      persist: {
        serializer: {
          serialize: (value) => encodeHashToBase64(encode(value)),
          deserialize: (value) => decode(decodeHashFromBase64(value)),
        },
      } as PersistedStateOptions,
    }
  );
