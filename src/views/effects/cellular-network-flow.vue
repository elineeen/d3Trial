<template>
  <div class="d-flex flex-row justify-space-between">
    <canvas id="flow-square" :width=baseConfig.width :height=baseConfig.height>></canvas>
    <canvas id="flow-cellular" :width=baseConfig.width :height=baseConfig.height>></canvas>
  </div>
</template>

<script>
import TWEEN from "@tweenjs/tween.js";
export default {
  name: "cellular-network-flow",
  data() {
    return {
      baseConfig: {
        width: 900,
        height: 300,
      },
      squareMoveOffsetPattern:[{x:30,y:30},{x:30,y:-30},{x:-30,y:30},{x:-30,y:-30}]
    }
  },
  methods:{
    generateCellularFlowBatch(){
      
    },
    generateSquareFlowBatch(){
      const {width,height}=this.baseConfig;
      let centerPoint=[width/2,height/2]
      let batchTween=this.squareMoveOffsetPattern.map((coordObj,index)=>{
        if(index===0)
        return this.generateSquareLineTween(centerPoint,index)
      })
      return batchTween
    },
     _getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min; //含最大值，含最小值
    },
    generateSquareLineTween(centerPoint,index){
      const {width,height}=this.baseConfig;
      let tweenList=[];
      let currentCoord=this._.cloneDeep(centerPoint)
      debugger;
      // let [horizonCellCount,verticalCellCount]=[width/30,height/30]
      let initOffset=this.squareMoveOffsetPattern[index];
      tweenList.push(this._generatorSingleTween(currentCoord,initOffset))
      currentCoord=[currentCoord[0]+initOffset.x,currentCoord[1]+initOffset.y]
      let inRangeX=(currentCoord[0]>=0)&&(currentCoord[0]<=width);
      let inRangeY=(currentCoord[1]>=0)&&(currentCoord[1]<=height)
      while(inRangeX&&inRangeY){
        let direction=this._getRandomIntInclusive(0,3),newOffset=this.squareMoveOffsetPattern[direction];
        tweenList.push(this._generatorSingleTween(currentCoord,newOffset))
        currentCoord=[currentCoord[0]+newOffset.x,currentCoord[1]+newOffset.y]
        inRangeX=(currentCoord[0]>=0)&&(currentCoord[0]<=width);
        inRangeY=(currentCoord[1]>=0)&&(currentCoord[1]<=height)
      }
      debugger;
      tweenList.forEach((tween,index)=>{
        if(index<tweenList.length-1)
          tween.chain(tweenList[index+1])
      })
      tweenList[0].start();
      return tweenList[0];
    },
    initAnimate(){
      const animate=()=>{
        window.requestAnimationFrame(animate)
        TWEEN.update();
      }
      animate();
    },
    renderCanvasBackground(canvasID){
      const {width,height}=this.baseConfig;
      const  canvasInstance=document.getElementById(canvasID).getContext('2d');
      canvasInstance.fillRect(0,0,width,height);
      canvasInstance.beginPath();
      canvasInstance.fillStyle =  'rgb(40,40,40,0.2)';
      canvasInstance.fill()
    },
    _generatorSingleTween(currentPoint,offSetObj){
      console.log(`${currentPoint[0]} ${currentPoint[1]} to ${currentPoint[0]+offSetObj.x} ${currentPoint[1]+offSetObj.y}`)
      let tweenObject={x:currentPoint[0],y:currentPoint[1]}
      const  canvasInstance=document.getElementById('flow-square').getContext('2d');
      canvasInstance.fillStyle =  'rgb(40,40,40,0.2)';
      canvasInstance.lineWidth = 1;
      canvasInstance.strokeStyle = "#ffffff";
      let oldRecord
      return new TWEEN.Tween(tweenObject)
          .to({x:currentPoint[0]+offSetObj.x,y:currentPoint[1]+offSetObj.y},250)
          .onUpdate(() => {
            if(oldRecord){
              canvasInstance.beginPath();
              canvasInstance.moveTo(oldRecord.x, oldRecord.y);
              canvasInstance.lineTo(tweenObject.x, tweenObject.y);
              canvasInstance.stroke();
            }
            oldRecord={...tweenObject};
          })
    }
  },
  mounted() {
    this.$d3.interval(()=>{
      this.renderCanvasBackground('flow-square')
      this.generateSquareFlowBatch();
    },100)
    this.initAnimate();
  }
}
</script>

<style scoped>

</style>