<template>
  <div class="d-flex flex-column align-center justify-space-between">
    <canvas id="flow-square" :style="canvasStyle" :width=baseConfig.width :height=baseConfig.height></canvas>
    <canvas id="flow-cellular" :style="canvasStyle" :width=baseConfig.width :height=baseConfig.height></canvas>
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
      transitions:{
        lineColor:this.$d3.interpolateWarm
      },
      squareMoveOffsetPattern:[{x:30,y:30},{x:30,y:-30},{x:-30,y:30},{x:-30,y:-30}],
      cellularMoveOffsetPattern:[[{x:30,y:0},{x:-15,y:26},{x:-15,y:-26}],[{x:-30,y:0},{x:15,y:26},{x:15,y:-26}]],
      maxIteration:100,
    }
  },
  computed:{
    canvasStyle(){
      return {
        width:this.baseConfig.width+'px',
        height:this.baseConfig.height+'px'
      }
    }
  },
  methods:{
    generateCellularFlowBatch(){
      const {width,height}=this.baseConfig;
      let centerPoint=[width/2,height/2]
      let batchTween=this.cellularMoveOffsetPattern[0].map((coordObj,index)=>{
          return this.generateCellularLineTween(centerPoint,index)
      })
      return batchTween
    },
    generateCellularLineTween(centerPoint,index){
      const {width,height}=this.baseConfig;
      let tweenList=[];
      let currentCoord=this._.cloneDeep(centerPoint)
      //在两种pattern之间循环切换
      let patternIndexSelector=0;
      let initOffset=this.cellularMoveOffsetPattern[patternIndexSelector][index];
      tweenList.push(this._generateSingleComplexTween(currentCoord,initOffset,'flow-cellular'))
      for(let i=0;i<this.maxIteration;i++){
        let inRangeX=(currentCoord[0]>=0)&&(currentCoord[0]<=width);
        let inRangeY=(currentCoord[1]>=0)&&(currentCoord[1]<=height)
        if(inRangeX&&inRangeY){
          patternIndexSelector=i%2
          let direction=this._getRandomIntInclusive(0,2),
              newOffset=this.cellularMoveOffsetPattern[patternIndexSelector][direction];
          tweenList.push(this._generateSingleComplexTween(currentCoord,newOffset,'flow-cellular',i))
          currentCoord=[currentCoord[0]+newOffset.x,currentCoord[1]+newOffset.y]
        }
        else 
          return;
      }
      //动画连接
      tweenList.forEach((tween,index)=>{
        if(index<tweenList.length-1)
          tween.chain(tweenList[index+1])
      })
      tweenList[0].start();
      return tweenList[0];
    },
    generateSquareFlowBatch(){
      const {width,height}=this.baseConfig;
      let centerPoint=[width/2,height/2]
      let batchTween=this.squareMoveOffsetPattern.map((coordObj,index)=>{
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
      // let [horizonCellCount,verticalCellCount]=[width/30,height/30]
      let initOffset=this.squareMoveOffsetPattern[index];
      tweenList.push(this._generateSingleTween(currentCoord,initOffset))
      currentCoord=[currentCoord[0]+initOffset.x,currentCoord[1]+initOffset.y]
      let inRangeX=(currentCoord[0]>=0)&&(currentCoord[0]<=width);
      let inRangeY=(currentCoord[1]>=0)&&(currentCoord[1]<=height)
      while(inRangeX&&inRangeY){
        let direction=this._getRandomIntInclusive(0,3),newOffset=this.squareMoveOffsetPattern[direction];
        tweenList.push(this._generateSingleTween(currentCoord,newOffset))
        currentCoord=[currentCoord[0]+newOffset.x,currentCoord[1]+newOffset.y]
        inRangeX=(currentCoord[0]>=0)&&(currentCoord[0]<=width);
        inRangeY=(currentCoord[1]>=0)&&(currentCoord[1]<=height)
      }
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
    renderCanvasBackground(canvasID,canvasTitle){
      const {width,height}=this.baseConfig;
      const  canvasInstance=document.getElementById(canvasID).getContext('2d');
      canvasInstance.fillRect(0,0,width,height);
      canvasInstance.beginPath();
      canvasInstance.fillStyle =  'white';
      canvasInstance.font='normal 20px serif'
      canvasInstance.fillText(canvasTitle,20,20);
      canvasInstance.fillStyle =  'rgb(40,40,40,0.2)';
      canvasInstance.fill()
    },
    /**
     * 生成一个简单的两坐标点间补间动画实例
     * @param currentPoint
     * @param offSetObj
     * @param targetCanvasId 需要渲染到的画布实例id
     * @returns {Tween<{x, y}>}
     * @private
     */
    _generateSingleTween(currentPoint,offSetObj,targetCanvasId='flow-square'){
      let tweenObject={x:currentPoint[0],y:currentPoint[1]}
      const  canvasInstance=document.getElementById(targetCanvasId).getContext('2d');
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
    },
    /**
     * 生成一个复杂的两坐标点间补间动画实例，包含颜色渐变、附近随机点取样生成、线条宽度渐变
     * @param currentPoint
     * @param offSetObj
     * @param targetCanvasId
     * @param iterations 迭代次数
     * @returns {Tween<{x, y, lineWidth: number}>}
     * @private
     */
    _generateSingleComplexTween(currentPoint,offSetObj,targetCanvasId,iteration=0){
      let tweenObject={x:currentPoint[0],y:currentPoint[1],lineWidth:1,interpolateTick:0}
      const  canvasInstance=document.getElementById(targetCanvasId).getContext('2d');
      canvasInstance.fillStyle =  'rgb(40,40,40,0.2)';
      canvasInstance.lineWidth = 1;
      let oldRecord
      return new TWEEN.Tween(tweenObject)
          .easing(TWEEN.Easing.Cubic.Out)
          .to({x:currentPoint[0]+offSetObj.x,y:currentPoint[1]+offSetObj.y,lineWidth:6},250)
          .onUpdate(() => {
            if(oldRecord){
              // canvasInstance.globalCompositeOperation='overlay'
              canvasInstance.strokeStyle = this.transitions.lineColor((iteration+1)/this.maxIteration);
              canvasInstance.lineWidth = tweenObject.lineWidth;
              //懒了，不想努力了，随便写个类抽奖吧
              let atari=(this._getRandomIntInclusive(0,90)===44)
              if(atari){
                canvasInstance.beginPath();
                let randomPoint=[oldRecord.x +this._getRandomIntInclusive(-15,15),  oldRecord.y +this._getRandomIntInclusive(-10,10)]
                canvasInstance.moveTo(randomPoint[0],randomPoint[1])
                canvasInstance.lineTo(randomPoint[0]+this._getRandomIntInclusive(3,6), randomPoint[1]);
                canvasInstance.stroke();
              }
              canvasInstance.beginPath();
              canvasInstance.moveTo(oldRecord.x, oldRecord.y);
              canvasInstance.lineTo(tweenObject.x, tweenObject.y);
              canvasInstance.stroke();
            }
            oldRecord={...tweenObject};
          })
    },
    _generateRandomPointTween(currenttargetCanvasId){

    },
  },
  mounted() {
    this.$d3.interval(()=>{
      this.renderCanvasBackground('flow-square','simple effect square flow')
      this.renderCanvasBackground('flow-cellular','complex effect cellular flow ')
      this.generateSquareFlowBatch();
      this.generateCellularFlowBatch();
    },100)
    this.initAnimate();
  }
}
</script>

<style scoped>

</style>