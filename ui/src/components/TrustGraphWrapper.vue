<template>
  <q-card square class="q-mb-md text-body1">
    Adjust Trust in this Agent ( this goes below the agent avatar and name)
    <!--
    Indicator of how much trust you have in this agent - thermometer
    click to edit
    Becomes range selector
    -->

    <TrustGraphAtom
      v-for="(atom, i) in atoms"
      :key="i"
      :value="atom"
      @input="(val) => handleInput(val, i)"
    />
  </q-card>

  <q-card square class="q-mb-md text-body1">
    <q-checkbox v-model="allTopics" label="Add Trust Tags" />
    <!--
    Add Trust Ratings
    Add Trust Tags

-->

    <!-- <div class="flex items-center justify-between" v-if="!allTopics">
      <div class="flex" style="font-weight: bold">topic</div>
      <div class="flex" style="font-weight: bold">weight</div>
    </div> -->

    <q-list v-if="!allTopics">
      <TrustGraphAtom
        v-for="(atom, i) in atoms"
        :key="i"
        :value="atom"
        @input="(val) => handleInput(val, i)"
      />
    </q-list>
    <button @click="addAtom">Add</button>
  </q-card>
</template>

<script setup lang="ts">
import TrustGraphAtom from "@/components/TrustGraphAtom.vue";
import { onMounted, ref } from "vue";
import { useQuasar, QCheckbox } from "quasar";
import { TrustGraphAtomData } from "../types/types";

const $q = useQuasar();

defineEmits(["update:topic", "update:weight"]);

const atoms = ref<TrustGraphAtomData[]>([]);

const allTopics = ref(true);

const addAtom = async () => {
  atoms.value.push({ topic: "", weight: 0 });
};

function handleInput(val, i) {
  const atom = atoms.value[i];
  const key = Object.keys(val)[0];
  atom[key] = val[key];
  atoms.value[i] = atom;
}
</script>
