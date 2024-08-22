<template>
  <div class="py-4">
    <div
      v-if="
        NotificationType.MyAgentFollowed === notification.notification_type
      "
      class="flex justify-between items-center py-2"
      style="width: 100%"
    >
      <div class="flex justify-start items-start space-x-2">
        <BaseAgentProfileLinkName
          :agentPubKey="notification.agent"
          :profile="notification.agent_profile"
        />
        <div class="font-mono">Followed you</div>
      </div>
      <div>
        <BaseTimestamp class="font-mono" :timestamp="notification.timestamp" />
      </div>
    </div>
    <div
      v-else-if="
        NotificationType.MyAgentUnfollowed === notification.notification_type
      "
      class="flex justify-between items-center py-2 w-full space-x-2"
    >
      <div class="flex justify-start items-start space-x-2">
        <BaseAgentProfileLinkName
          :agentPubKey="notification.agent"
          :profile="notification.agent_profile"
        />
        <div class="font-mono">Unfollowed you</div>
      </div>
      <div>
        <BaseTimestamp class="font-mono" :timestamp="notification.timestamp" />
      </div>
    </div>
    <div
      v-else-if="
        NotificationType.MyAgentMentioned === notification.notification_type
      "
      class="my-2 w-full"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="font-mono">Mentioned you in a mew</div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>

    <div
      v-else-if="
        NotificationType.MyMewLicked === notification.notification_type
      "
      class="py-2 w-full"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="font-mono">Licked your mew</div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>

    <div
      v-else-if="
        NotificationType.MyMewUnlicked === notification.notification_type
      "
      style="width: 100%"
      class="w-full py-2"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="font-mono">Unlicked your mew</div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>

    <div
      v-else-if="
        NotificationType.MyMewPinned === notification.notification_type
      "
      class="w-full py-2"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="font-mono">Pinned your mew</div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>

    <div
      v-else-if="
        NotificationType.MyMewUnpinned === notification.notification_type
      "
      class="py-2 w-full"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="font-mono">Unpinned your mew</div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>

    <div
      v-else-if="
        NotificationType.MyMewResponded === notification.notification_type
      "
      class="w-full py-2"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div
            v-if="
              notification.feed_mew &&
              MewTypeName.Reply in notification.feed_mew.mew.mew_type
            "
            class="font-mono"
          >
            Replied to your mew
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Quote in notification.feed_mew.mew.mew_type
            "
            class="font-mono"
          >
            Quoted your mew
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Mewmew in notification.feed_mew.mew.mew_type
            "
            class="font-mono"
          >
            Mewmewed your mew
          </div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>

    <div
      v-else-if="
        NotificationType.FollowedYarnResponded ===
        notification.notification_type
      "
      class="py-2 w-full"
    >
      <div class="flex justify-between items-start">
        <div class="flex justify-start items-start space-x-2">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div
            v-if="
              notification.feed_mew &&
              MewTypeName.Reply in notification.feed_mew.mew.mew_type
            "
            class="font-mono"
          >
            Replied to a yarn you participated in
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Quote in notification.feed_mew.mew.mew_type
            "
            class="font-mono"
          >
            Quoted a yarn you participated in
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Mewmew in notification.feed_mew.mew.mew_type
            "
            class="font-mono"
          >
            Memewed a yarn you participated in
          </div>
        </div>
        <div>
          <BaseTimestamp
            class="font-mono"
            :timestamp="notification.timestamp"
          />
        </div>
      </div>
      <div class="bg-base-200 rounded-xl mt-4 mx-4">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NotificationType,
  Notification,
  FeedMew,
  MewTypeName,
} from "@/types/types";
import BaseTimestamp from "@/components/BaseTimestamp.vue";
import BaseAgentProfileLinkName from "@/components/BaseAgentProfileLinkName.vue";
import BaseMewListItem from "@/components/BaseMewListItem.vue";

defineProps<{
  notification: Notification;
}>();
</script>
