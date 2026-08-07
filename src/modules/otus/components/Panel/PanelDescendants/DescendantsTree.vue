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
      class="text-secondary"
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
import {
  DESCENDANTS_TREE_ROOT_ID,
  useDescendantsTreeStore
} from './store/useDescendantsTreeStore'
import { inject, ref, watch } from 'vue'

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

const treeStore = useDescendantsTreeStore()
const rootOtuId = inject(DESCENDANTS_TREE_ROOT_ID)
const otuId = props.taxonomy.otu_id

const isTreeVisible = ref(
  treeStore.isExpanded(rootOtuId, otuId) ?? !!props.taxonomy.descendants.length
)
const descendants = ref(
  treeStore.getDescendants(rootOtuId, otuId) ?? [...props.taxonomy.descendants]
)

watch(isTreeVisible, (newVal) => {
  treeStore.setExpanded(rootOtuId, otuId, newVal)

  if (newVal) {
    loadDescendants()
  }
})

const loadDescendants = () => {
  if (descendants.value.length) {
    return
  }
  TaxonWorks.getTaxonomy(otuId, {
    params: {
      max_descendants_depth: 1
    }
  })
    .then(({ data }) => {
      descendants.value = data.descendants
      treeStore.setDescendants(rootOtuId, otuId, data.descendants)
    })
    .catch(() => {})
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
    border-left: 1px solid var(--tp-tree-line);
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
    border-bottom: 1px solid var(--tp-tree-line);
    content: '';
    display: inline-block;
    left: -6px;
  }

  li:last-child:before {
    border-left: 1px solid var(--tp-tree-line);
  }
}
</style>
