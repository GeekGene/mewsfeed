<template>
  <QItem>
    <div
      v-if="
        NotificationTypeName.MyAgentFollowed in notification.notification_type
      "
      class="row justify-between items-center q-py-sm"
      style="width: 100%"
    >
      <div class="row justify-start items-start">
        <BaseAgentProfileLinkName
          :agentPubKey="notification.agent"
          :profile="notification.agent_profile"
        />
        <div class="q-ml-lg text-body2">Followed you</div>
      </div>
      <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
    </div>
    <div
      v-else-if="
        NotificationTypeName.MyAgentUnfollowed in notification.notification_type
      "
      class="row justify-between items-center q-py-sm"
      style="width: 100%"
    >
      <div class="row justify-start items-start">
        <BaseAgentProfileLinkName
          :agentPubKey="notification.agent"
          :profile="notification.agent_profile"
        />
        <div class="q-ml-lg text-body2">Unfollowed you</div>
      </div>
      <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
    </div>
    <div
      v-else-if="
        NotificationTypeName.MyAgentMentioned in notification.notification_type
      "
      style="width: 100%"
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="q-ml-lg text-body2">Mentioned you in a mew</div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2">
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
      style="width: 100%"
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="q-ml-lg text-body2">Licked your mew</div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2 q-mx-lg q-mt-lg">
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
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="q-ml-lg text-body2">Unlicked your mew</div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2 q-mx-lg q-mt-lg">
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
      style="width: 100%"
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="q-ml-lg text-body2">Pinned your mew</div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2 q-mx-lg q-mt-lg">
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
      style="width: 100%"
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div class="q-ml-lg text-body2">Unpinned your mew</div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2 q-mx-lg q-mt-lg">
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
      style="width: 100%"
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div
            v-if="
              notification.feed_mew &&
              MewTypeName.Reply in notification.feed_mew.mew.mew_type
            "
            class="q-ml-lg text-body2"
          >
            Replied to your mew
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Quote in notification.feed_mew.mew.mew_type
            "
            class="q-ml-lg text-body2"
          >
            Quoted your mew
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Mewmew in notification.feed_mew.mew.mew_type
            "
            class="q-ml-lg text-body2"
          >
            Mewmewed your mew
          </div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2 q-mx-lg q-mt-lg">
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
      style="width: 100%"
      class="q-py-sm"
    >
      <div class="row justify-between items-start">
        <div class="row justify-start items-start">
          <BaseAgentProfileLinkName
            :agentPubKey="notification.agent"
            :profile="notification.agent_profile"
          />
          <div
            v-if="
              notification.feed_mew &&
              MewTypeName.Reply in notification.feed_mew.mew.mew_type
            "
            class="q-ml-lg text-body2"
          >
            Replied to a yarn you participated in
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Quote in notification.feed_mew.mew.mew_type
            "
            class="q-ml-lg text-body2"
          >
            Quoted a yarn you participated in
          </div>
          <div
            v-else-if="
              notification.feed_mew &&
              MewTypeName.Mewmew in notification.feed_mew.mew.mew_type
            "
            class="q-ml-lg text-body2"
          >
            Memewed a yarn you participated in
          </div>
        </div>
        <div><BaseTimestamp :timestamp="notification.timestamp" /></div>
      </div>
      <div class="bg-grey-2 q-mx-lg q-mt-lg">
        <BaseMewListItem
          :feed-mew="(notification.feed_mew as FeedMew)"
          v-bind="$attrs"
        />
      </div>
    </div>
  </QItem>
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
import { QItem } from "quasar";
import BaseMewListItem from "@/components/BaseMewListItem.vue";

defineProps<{
  notification: Notification;
}>();
</script>
