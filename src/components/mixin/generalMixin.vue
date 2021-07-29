<template>

</template>

<script>
export default {
  name: "generalMixin",
  methods:{
    createGroupOrigin(layerName,transformCord=[0,0],selector='svg'){
      let origin=this.$d3.select(selector)
          .append("g")
      origin.attr('transform',`translate(${transformCord[0]},${transformCord[1]})`);
      if(layerName)
        origin.attr('class',layerName)
      return origin;
    },
  }
}
</script>

<style scoped>

</style>