<template>
  <div class="d-flex justify-center align-center flex-column">
    <v-banner class="title" width="50%">Graph of Timeline Pattern</v-banner>
    <canvas id="flow-future-2-current" :height=baseConfig.height :style="canvasStyle" :width=baseConfig.width></canvas>
  </div>

</template>

<script>
import TWEEN from '@tweenjs/tween.js'
import * as Comlink from "comlink";
import Worker from './timline.worker'
export default {
  name: 'timelineGraph',
  data () {
    return {
      baseConfig: {
        width: 900,
        height: 1200,
        clusterHeight: 530, //拐点2
        centralHeight: 600,
        flowStartHeight: 60,
        inflectionHeight: 400, //拐点1
        mainLaneNum: 20,
        randomLaneNum: 80,
        clusterBand: 40,
        particleFallStartThreshHold: 670,
        particleFallSpreadThreshHold: 750,
        particleFallEndThreshHold: 950,//粒子消逝位置
      },
      simulationConfig: {
        nodeList: [],
        simulation: null,
      },
      workerInstance:null,
      control: {
        isParticleStart: false,
        flowPerTick: 5,//每个interval产生的流数量
        randomLaneIterations: 8,//在到达必须汇入点前进行的迭代次数
        conjureLaneChancePercent: 15,//每次迭代随机流汇入主流的几率
        flowSpeed: 200,
      }
    }
  },
  computed: {
    //粒子下落速度调整
    particleYSpeedScale () {
      const {
        particleFallStartThreshHold,
        particleFallSpreadThreshHold,
        particleFallEndThreshHold,
        height
      } = this.baseConfig
      return this.$d3.scaleThreshold(
          [particleFallStartThreshHold, particleFallSpreadThreshHold, particleFallEndThreshHold],
          [-0.005, -0.005, -0.0005, -0.0005])
    },
    particleXForceXScale () {

      return this.$d3.scaleOrdinal([0, 1], [0, this.baseConfig.width])
    },
    canvasStyle () {
      return {
        width: this.baseConfig.width + 'px',
        height: this.baseConfig.height + 'px'
      }
    },
    // 宽度比例调整以模拟插图上的不均匀分布
    // 中间1/2 in 1/3 place
    // 其余1/2 in 2/3 place
    mainLaneXPositionScale () {
      let { mainLaneNum, width } = this.baseConfig, quarterLaneNum = Math.floor(mainLaneNum) / 4
      return this.$d3.scaleLinear([0, quarterLaneNum, quarterLaneNum * 3, mainLaneNum], [0, Math.floor(width / 3), Math.floor(width / 3) * 2, width])
    },
    randomLaneXPositionScale () {
      let { randomLaneNum, width } = this.baseConfig, quarterLaneNum = Math.floor(randomLaneNum) / 4
      return this.$d3.scaleLinear([0, quarterLaneNum, quarterLaneNum * 3, randomLaneNum], [0, Math.floor(width / 3), Math.floor(width / 3) * 2, width])
    }
  },
  methods: {
    _getClusterPoint (mainFlowIndex) {
      let { clusterHeight, mainLaneNum, width, clusterBand } = this.baseConfig
      const halfBand = clusterBand / 2
      const xScale = this.$d3.scaleLinear([0, mainLaneNum], [width / 2 - halfBand, width / 2 + halfBand])
      return [xScale(mainFlowIndex), clusterHeight]
    },
    /**
     * 生成一个简单的两坐标点间补间动画实例
     * @param currentPoint
     * @param targetPoint
     * @param targetCanvasId 需要渲染到的画布实例id
     * @returns {Tween<{x, y}>}
     * @private
     */
    _generateSingleTween (currentPoint, targetPoint, targetCanvasId = 'flow-future-2-current') {
      let tweenObject = { x: currentPoint[0], y: currentPoint[1] }
      let distance = Math.sqrt(Math.pow(targetPoint[0] - currentPoint[0], 2) + Math.pow(targetPoint[1] - currentPoint[1], 2))
      const { flowSpeed } = this.control
      let duration = (distance / flowSpeed) * 1000
      const canvasInstance = document.getElementById(targetCanvasId).getContext('2d')
      canvasInstance.fillStyle = 'rgb(255,255,255,0.1)'
      canvasInstance.lineWidth = 1
      canvasInstance.strokeStyle = '#000000'
      //必须从初始值开始，否则会造成不连续
      let oldRecord = this._.cloneDeep(tweenObject)
      return new TWEEN.Tween(tweenObject)
          .easing(TWEEN.Easing.Cubic.Out)
          .to({ x: targetPoint[0], y: targetPoint[1] }, duration)
          .onUpdate(() => {
            if (oldRecord) {
              this._drawLine(oldRecord, tweenObject, canvasInstance)
            }
            oldRecord = { ...tweenObject }
          })
          .onComplete(() => {
            this._drawLine(oldRecord, tweenObject, canvasInstance)
          })
    },
    _drawLine (fromObj, toObj, canvas) {
      canvas.beginPath()
      canvas.moveTo(fromObj.x, fromObj.y)
      canvas.lineTo(toObj.x, toObj.y)
      canvas.stroke()
      return canvas
    },
    /**
     * 批量绘制，优化了同时粒子最大渲染数量
     **/
    _batchDrawParticleFromNode (canvasID, nodeList) {
      const ctx = document.getElementById(canvasID).getContext('2d'), { particleFallStartThreshHold } = this.baseConfig
      nodeList.forEach((nodeData) => {
        const { x, y, r } = nodeData
        if (y > particleFallStartThreshHold) {
          ctx.strokeStyle = `rgb(40,40,40,${nodeData.opacity})`
          ctx.fillStyle = `rgb(40,40,40,${nodeData.opacity})`
          ctx.beginPath()
          ctx.arc(x, y, r, 0, 2 * Math.PI, false)
          ctx.fill()
        }
      })
    },
    renderCanvasBackground (canvasID) {
      const { width, height } = this.baseConfig
      const canvasInstance = document.getElementById(canvasID).getContext('2d')

      canvasInstance.beginPath()
      canvasInstance.fillRect(0, 0, width, height)
      canvasInstance.fillStyle = 'rgb(255,255,255,0.15)'
      canvasInstance.fill()
      this._drawStaticBlock(canvasInstance, [0, 0], 'FUTURE')
      this._drawStaticBlock(canvasInstance, [0, height / 2], 'CURRENT')
      this._drawStaticBlock(canvasInstance, [0, height - 100], 'PAST')
    },
    renderSimulationBackground (canvasID) {
      const { width, height } = this.baseConfig
      const canvasInstance = document.getElementById(canvasID).getContext('2d')
      canvasInstance.beginPath()
      canvasInstance.fillStyle = 'rgb(255,255,255,1)'
      canvasInstance.fillRect(0, height / 2 + 60, width, height / 2 - 160)
      canvasInstance.fill()
    },
    /**
     * 生成一个区块
     * ctx 画布实例
     * startPoint 起始点
     * text 内容文字
     **/
    _drawStaticBlock (ctx, startPoint, text) {
      const { width, height } = this.baseConfig
      ctx.fillStyle = 'lightgrey'
      ctx.fillRect(startPoint[0], startPoint[1], width, 60)
      ctx.fillStyle = 'white'
      ctx.fillRect(startPoint[0] + 5, startPoint[1] + 5, width - 10, 50)
      ctx.fillStyle = 'black'
      ctx.font = '56px Avenir,Helvetica'
      ctx.fillText(text, width / 2 - 100, startPoint[1] + 50)
      return true
    },
    initAnimate () {
      const animate = () => {
        window.requestAnimationFrame(animate)
        this.handleWorkerSimulation();
        TWEEN.update()
        //点绘制必须实时animate中重新渲染第二部分画布
        this.renderSimulationBackground('flow-future-2-current')
        this._batchDrawParticleFromNode('flow-future-2-current',this.simulationConfig.nodeList)
       // this.simulationConfig?.simulation?.nodes().forEach(d => this._drawParticleFromNode('flow-future-2-current', d))
      }
      animate()
    },
    _getRandomIntInclusive (min, max) {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min + 1)) + min //含最大值，含最小值
    },
    _calcPreciseConjureIndex (rawIndex, startPoint) {
      let XPositionList = [rawIndex, rawIndex + 1]
          .map(d => Math.abs(startPoint[0] - this.mainLaneXPositionScale(d)))
      return XPositionList[0] > XPositionList[1] ? (rawIndex + 1) : rawIndex
    },
    /**
     * 根据control里迭代次数变量和迭代几率随机汇入主流，如果一直未汇入则最后一次迭代必定汇入主流,拼接汇入主流之后的tween
     * @param flowIndex 流位置编号
     */
    generateRandomFlowRoute (flowIndex = 0) {
      const { mainLaneNum, randomLaneNum } = this.baseConfig
      const ratio = Math.floor(randomLaneNum / mainLaneNum)
      //如果直接就在主流上，直接生成主流
      if (flowIndex % ratio === 0) {
        return this.generateMainFlowRoute(Math.floor(flowIndex / ratio))
      } else {
        const { randomLaneIterations, conjureLaneChancePercent } = this.control
        const { flowStartHeight, inflectionHeight, width } = this.baseConfig
        const initialXScale = this.randomLaneXPositionScale
        const targetXScale = this.mainLaneXPositionScale
        let tweenList = []
        let conjureFlag = false//迭代交汇flag
        let pointList = [[initialXScale(flowIndex), flowStartHeight]]
        let targetMainFlowIndex = this._calcPreciseConjureIndex(Math.floor(flowIndex / ratio), pointList[0])
        for (let i = 1; i < randomLaneIterations; i++) {
          let lastPosition = pointList[pointList.length - 1]
          conjureFlag = (this._getRandomIntInclusive(1, 100) <= conjureLaneChancePercent)
          if (conjureFlag) {
            break
          } else {
            let newPosition = [lastPosition[0], lastPosition[1] + (inflectionHeight - flowStartHeight) / randomLaneIterations]
            pointList.push(newPosition)
          }
        }
        let lastPosition = pointList[pointList.length - 1]
        //最终必汇合到主流中
        pointList.push([targetXScale(targetMainFlowIndex), lastPosition[1] + (inflectionHeight - flowStartHeight) / randomLaneIterations])
        //生成第一段迭代tween
        pointList.forEach((point, index) => {
          if (index < pointList.length - 1) {
            tweenList.push(this._generateSingleTween(point, pointList[index + 1]))
          }
        })
        //拼接两端tween
        tweenList.push(this.generateMainFlowRoute(targetMainFlowIndex, pointList[pointList.length - 1]))
        tweenList.forEach((tween, index) => {
          if (index < tweenList.length - 1)
            tween.chain(tweenList[index + 1])
        })
        return tweenList[0]
      }
    },
    /**
     *  主流汇聚逻辑逻辑
     *  mainFlowIndex 汇入主流编号
     *  customStartPoint 支流汇入点
     */
    generateMainFlowRoute (mainFlowIndex = 0, customStartPoint, autoStart = false) {
      const { flowStartHeight, centralHeight, inflectionHeight } = this.baseConfig
      const initialXScale = this.mainLaneXPositionScale

      let startPoint = customStartPoint || [initialXScale(mainFlowIndex), flowStartHeight],
          inflectionPoint = [initialXScale(mainFlowIndex), inflectionHeight],
          clusterPoint = this._getClusterPoint(mainFlowIndex),
          endPoint = [clusterPoint[0], centralHeight]
      let pointList = [startPoint, inflectionPoint, clusterPoint, endPoint]
      let tweenList = []
      pointList.forEach((point, index) => {
        if (index < pointList.length - 1)
          tweenList.push(this._generateSingleTween(point, pointList[index + 1]))
      })
      tweenList.forEach((tween, index) => {
        if (index < tweenList.length - 1)
          tween.chain(tweenList[index + 1])
      })
      //如果粒子特效未启动，则汇入后设置汇入标志位，
      if (!this.control.isParticleStart) {
        tweenList[tweenList.length - 1].onComplete(() => {
          this.control.isParticleStart = true
        })
      }
      if (autoStart) {
        tweenList[0].start()
      }
      return tweenList[0]
    },
    /**
     * 生成新粒子
     * @param number 粒子数量
     * @private
     */
    _generateParticleData (number = 5) {
      let { width, height, clusterBand, particleFallStartThreshHold } = this.baseConfig
      const k = width / 800
      const halfBand = clusterBand / 2
      const r = this.$d3.randomUniform(k, k * 4)
      const xForceR = this.$d3.randomUniform(0, 0.004)
      const xRandom = this.$d3.randomUniform(width / 2 - halfBand, width / 2 + halfBand)
      const yRandom = this.$d3.randomUniform(height / 2, particleFallStartThreshHold)
      let dataAdapter = Array.from({ length: number }, (_, i) => ({
        r: r(),
        x: xRandom(),
        xForce: xForceR(),
        y: yRandom(),
        isPerformed: false,
        isTweenState: false,
        opacity: 1,
        direction: this.particleXForceXScale(this.$d3.randomInt(0, 1))
      }))
      this.simulationConfig.nodeList = this.simulationConfig.nodeList.concat(dataAdapter)
      //需要对simulation重新设置node参数2
      this.simulationConfig.simulation?.nodes(this.simulationConfig.nodeList)
    },
    _generateParticleFadeTween (node) {
      node.isTweenState = true
      return new TWEEN.Tween(node)
          .easing(TWEEN.Easing.Cubic.Out)
          .to({ opacity: 0 }, 1000)
          // .onUpdate(()=>{
          //   this._drawSingleParticleFromNode('flow-future-2-current',node);
          // })
          .onComplete(() => {
            node.isPerformed = true
          })
          .start()
    },
    /**
     * 从worker接受simulation数据并进行更换
     */
    async handleWorkerSimulation(){
      let worker=this.workerInstance
      if(worker){
        let  {nodeList}=await worker.getSimulationData();
        this.simulationConfig.nodeList=nodeList
      }
    },
  },
  watch: {
    'control.isParticleStart':async function (newVal) {
      if (newVal) {
         let worker= new Worker();
        // WebWorkers use `postMessage` and therefore work with Comlink.
        this.workerInstance = Comlink.wrap(worker);
        this.workerInstance.initParticleSimulation(Comlink.proxy((res)=>{
        }));
      }
    }
  },
  mounted () {
    const { flowPerTick } = this.control
    const { randomLaneNum } = this.baseConfig
    this.$d3.interval(() => {
      //流数据生成
      for (let i = 0; i < flowPerTick; i++) {
        let tweenStater = this.generateRandomFlowRoute(this._getRandomIntInclusive(0, randomLaneNum))
        tweenStater.start()
      }
      this.renderCanvasBackground('flow-future-2-current')
    }, 100)
    this.initAnimate()
  }
}
</script>

<style lang="scss" scoped>
.title {
  text-align: center;
}

</style>