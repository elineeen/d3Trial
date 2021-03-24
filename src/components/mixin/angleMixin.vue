<template>
    
</template>

<script>
    export default {
        name: "angleMixin",
        methods:{
            /**
             *根据偏移角度计算是在左侧还是右侧,取较小角度
             * @param offsetAngle
             * @returns {string}
             */
            getAnglePosition(offsetAngle){
                let position='';
                if(offsetAngle>0&&offsetAngle<Math.PI)
                    position='left';
                else if(offsetAngle< -Math.PI)
                    position='left';
                else if(offsetAngle>Math.PI)
                    position='right'
                else if(offsetAngle<0&&offsetAngle>-Math.PI)
                    position="right"
                return position
            },}
    }
</script>

<style scoped>

</style>