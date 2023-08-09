import {
  AppAgentClient,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import { StateTree, defineStore } from "pinia";
import { computed, ref } from "vue";
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

export const makeUseNotificationsReadStore = (client: AppAgentClient) =>
  defineStore(
    "notificationsRead",
    () => {
      const notificationsCount = ref<number>(0);
      const notificationsRead = ref<{
        [key: string]: boolean;
      }>({});
      const unreadCount = computed(
        () =>
          notificationsCount.value -
          Object.values(notificationsRead.value).filter((r) => r).length
      );

      function markRead(notification: Notification) {
        const key = notificationToKey(notification);
        notificationsRead.value[key] = true;
      }

      function addNotificationStatus(
        notification: Notification,
        status = false
      ) {
        const key = notificationToKey(notification);

        if (notificationsRead.value[key] === undefined) {
          notificationsRead.value[key] = status;
        }
      }

      function setNotificationsCount(count: number) {
        notificationsCount.value = count;
      }

      return {
        notificationsRead,
        unreadCount,
        markRead,
        addNotificationStatus,
        setNotificationsCount,
      };
    },
    {
      persist: {
        key: `notificationsRead/${encodeHashToBase64(client.myPubKey)}`,
        serializer: {
          serialize(value: StateTree): string {
            return encodeHashToBase64(encode(value));
          },
          deserialize(value: string): StateTree {
            return decode(decodeHashFromBase64(value)) as StateTree;
          },
        },
      },
    }
  );
