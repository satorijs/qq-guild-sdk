<template>
  <div class="panel-view">
    <div class="title">123</div>
    <template v-for="name of tabs">
      <slot v-if="tab === name" :name="name"/>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, useSlots, onMounted } from 'vue'

const
  slots = useSlots(),
  tab = ref('default'),
  tabs = computed(() => Object.keys(slots))

onMounted(() => {
  console.log(Object.keys(slots))
})
</script>

<style lang="scss">
div.panel-view {
}
</style>
