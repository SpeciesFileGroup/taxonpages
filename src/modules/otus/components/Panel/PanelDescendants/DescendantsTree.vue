<template>
  <li
    v-if="Object.keys(taxonomy).length"
    :key="taxonomy.otu_id"
  >
    <button-expand
      v-if="!taxonomy.leaf_node"
      v-model="isTreeVisible"
      class="absolute -left-2.5"
    />
    <router-link
      class="text-primary-500"
      :to="{ name: 'otus-id', params: { id: taxonomy.otu_id } }"
      v-html="taxonomy.name"
    />
    <DescendantsSynonymList
      v-if="taxonomy.nomenclatural_synonyms.length"
      class="pb-4"
      :list="taxonomy.nomenclatural_synonyms"
    />
    <AnimationOpacity>
      <ul
        v-if="descendants.length"
        class="tree"
      >
        <template
          v-for="item in descendants"
          :key="item.otu_id"
        >
          <AnimationOpacity>
            <DescendantsTree
              v-if="isTreeVisible"
              :taxonomy="item"
            />
          </AnimationOpacity>
        </template>
      </ul>
    </AnimationOpacity>
  </li>
</template>

<script setup>
import DescendantsTree from './DescendantsTree.vue'
import DescendantsSynonymList from './DescendantsSynonymList.vue'
import TaxonWorks from '../../../services/TaxonWorks'
import { ref, watch } from 'vue'

const props = defineProps({
  taxonomy: {
    type: Object,
    required: true
  },

  level: {
    type: Number,
    default: 1
  }
})

const isTreeVisible = ref(!!props.taxonomy.descendants.length)
const descendants = ref([...props.taxonomy.descendants])

watch(isTreeVisible, (newVal) => {
  if (newVal) {
    loadDescendants()
  }
})

const loadDescendants = () => {
  if (descendants.value.length) {
    return
  }
  TaxonWorks.getTaxonomy(props.taxonomy.otu_id, {
    params: {
      max_descendants_depth: 1
    }
  }).then(({ data }) => {
    descendants.value = data.descendants
  })
}
</script>

<style lang="scss" scoped>
.tree {
  list-style: none;
  margin: 0;
  padding: 0;

  ul {
    margin-left: 14px;
  }

  li {
    position: relative;
    margin: 0;
    padding: 0px 6px;
    border-left: 1px solid rgb(100, 100, 100);
  }

  li:last-child {
    border-left: none;
  }

  li:before {
    position: relative;
    top: -0.3em;
    height: 1em;
    width: 12px;
    color: white;
    border-bottom: 1px solid rgb(100, 100, 100);
    content: '';
    display: inline-block;
    left: -6px;
  }

  li:last-child:before {
    border-left: 1px solid rgb(100, 100, 100);
  }
}
</style>
