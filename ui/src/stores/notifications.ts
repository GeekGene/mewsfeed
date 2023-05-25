import {
  AgentPubKey,
  AppAgentClient,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRequest } from "vue-request";
import { CacheData, Notification } from "@/types/types";
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
      const myPubKey = ref<AgentPubKey>(client.myPubKey);
      const notificationsCache = ref<CacheData<Notification[]>>({
        data: [],
        params: null,
        time: -1,
      });
      const notificationsRead = ref<{
        [key: string]: boolean;
      }>({});
      const unreadCount = computed(
        () =>
          notificationsCache.value.data
            .map((n) => notificationsRead.value[notificationToKey(n)])
            .filter((r) => !r).length
      );
      const notifications = computed(() => notificationsCache.value.data);
      const myPubKeyB64 = computed(() => encodeHashToBase64(myPubKey.value));

      // @todo not sure if this will actually work
      if (client.myPubKey !== myPubKey.value) {
        notificationsCache.value.data = [];
        notificationsRead.value = {};
        myPubKey.value = client.myPubKey;
      }

      const fetchNotifications = (): Promise<Notification[]> =>
        client.callZome({
          role_name: "mewsfeed",
          zome_name: "mews",
          fn_name: "get_notifications_for_agent",
          payload: client.myPubKey,
        });

      const { loading, error, runAsync } = useRequest(fetchNotifications, {
        cacheKey: `mews/get_notifications_for_agent/${myPubKeyB64.value}`,
        pollingInterval: 30 * 1000, // 30 seconds polling
        refreshOnWindowFocus: true,
        refocusTimespan: 0, // 0 seconds between window focus to trigger refresh
        loadingDelay: 1000,
        setCache: (
          _cacheKey: string,
          cacheData: CacheData<Notification[]>
        ): void => {
          notificationsCache.value = cacheData;

          (cacheData.data as Notification[]).forEach(
            (notification: Notification) => {
              const key = notificationToKey(notification);
              if (!Object.keys(notificationsRead.value).includes(key)) {
                notificationsRead.value[key] = false;
              }
            }
          );
        },
        getCache: (): CacheData<Notification[]> => {
          return notificationsCache.value;
        },
      });

      function markRead(notification: Notification) {
        const key = notificationToKey(notification);
        notificationsRead.value[key] = true;
      }

      return {
        notificationsCache,
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
          serialize(value) {
            return encodeHashToBase64(encode(value));
          },
          deserialize(value) {
            return decode(decodeHashFromBase64(value));
          },
        },
      } as PersistedStateOptions,
    }
  );
