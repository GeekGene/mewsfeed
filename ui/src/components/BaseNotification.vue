<template>
  <div class="py-4">
    <div
      v-if="
        NotificationTypeName.MyAgentFollowed in notification.notification_type
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
        NotificationTypeName.MyAgentUnfollowed in notification.notification_type
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
        NotificationTypeName.MyAgentMentioned in notification.notification_type
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
        NotificationTypeName.MyMewLicked in notification.notification_type
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
        NotificationTypeName.MyMewUnlicked in notification.notification_type
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
        NotificationTypeName.MyMewPinned in notification.notification_type
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
        NotificationTypeName.MyMewUnpinned in notification.notification_type
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
        NotificationTypeName.MyMewResponded in notification.notification_type
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
        NotificationTypeName.FollowedYarnResponded in
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
  NotificationTypeName,
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
