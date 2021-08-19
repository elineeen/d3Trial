import * as Comlink from "comlink";
import * as d3 from 'd3';
import {cloneDeep} from 'lodash'
const instance = {
  nodeList: [],
  tweenNodeList:[],
  simulation: null,
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
  particleXForceXScale:d3.scaleOrdinal([0, 1], [0, 900]),
  particleYSpeedScale() {
    const {
      particleFallStartThreshHold,
      particleFallSpreadThreshHold,
      particleFallEndThreshHold,
    } = this
    return d3.scaleThreshold(
      [particleFallStartThreshHold, particleFallSpreadThreshHold, particleFallEndThreshHold],
      [-0.005, -0.005, -0.0005, -0.0005])
  },
  /**
   * 生成新粒子
   * @param number 粒子数量
   * @private
   */
  _generateParticleData (number = 5) {
    let { width, height, clusterBand, particleFallStartThreshHold } = this
    const k = width / 800
    const halfBand = clusterBand / 2
    const r = d3.randomUniform(k, k * 4)
    const xForceR = d3.randomUniform(0, 0.004)
    const xRandom = d3.randomUniform(width / 2 - halfBand, width / 2 + halfBand)
    const yRandom = d3.randomUniform(height / 2, particleFallStartThreshHold)
    let dataAdapter = Array.from({ length: number }, (_, i) => ({
      r: r(),
      x: xRandom(),
      xForce: xForceR(),
      y: yRandom(),
      isPerformed: false,
      isTweenState: false,
      opacity: 1,
      direction: this.particleXForceXScale(d3.randomInt(0, 1))
    }))
    this.nodeList = this.nodeList.concat(dataAdapter)
    if(this.simulation)
      this.simulation.nodes(this.nodeList)
  },
  //完成对新粒子及老粒子的状态管理
  adjustParticles () {
    let { nodeList,particleFallEndThreshHold } = this
    //根据粒子下落位置判断是否进行消逝动画
    nodeList.forEach(d => {
      if (d.y > particleFallEndThreshHold && (!d.isTweenState)) {
        // setTimeout(()=>{
          d.isPerformed=true;
        // },1000)
        this.tweenNodeList.push(d)
      }
    })
    //对已标记的粒子进行垃圾回收
    this.nodeList = nodeList.filter(d => !d.isPerformed)
    //重复迭代生成新粒子
    this._generateParticleData(100)
  },
  /**
   * 初始化粒子模拟
   */
  async initParticleSimulation () {
    console.dir('simulation worker start!')
    let nodeList = this.nodeList
    let { particleFallSpreadThreshHold } = this
    const simulation = d3.forceSimulation(nodeList)
      .alphaTarget(0.9) // stay hot
      .velocityDecay(0.2) // low friction
      //simulation forceX.x可以调节每个node速度上水平方向，官方文档上不推荐使用负值的force，实际使用后也会发现负值速度进行simulation与正常值不对称的问题
      .force('x', d3.forceX().strength(d => d.y > particleFallSpreadThreshHold ? d.xForce : 0).x(d => d.direction))
      .force('y', d3.forceY().strength(d => this.particleYSpeedScale()(d.y)))
    this.simulation = simulation
    d3.interval(() => {
      this.adjustParticles()
    }, 100)
    return 'simulation worker started'
  },
  getSimulationData(){
    let {nodeList,tweenNodeList}=this
    this.tweenNodeList=[];
    return {nodeList,tweenNodeList};
  }
};

Comlink.expose(instance);