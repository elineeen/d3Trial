<template>
    <canvas ref="gitCanvas" width="1000" height="1000"></canvas>
</template>

<script>
    import * as versor from  './versor'
    import * as topojson from "topojson";
    import {worldAltas} from "./world-atlas";
    export default {
        name: "gitIndex",
        data(){
            return{
                baseConfig:{
                    width:1000,
                    height:1000,
                    projection:null,
                    path:null,
                },
                loopData:{
                  renderList:[]
                },
                rawData:{
                    githubCommits:[],
                }
            }
        },
        computed:{
            canvasContext(){
                return this.$refs.gitCanvas.getContext('2d');
            }
        },
        methods:{
            async initData(){
                let [githubCommits,worldAtlasTopoJson]=await Promise.all(
                    [
                        this.$d3.json('./rawData/github-index.json'),
                    ]);
                _.assign(this.rawData,{githubCommits})
            },
            //初始化投影，根据投影生成geopath adapter，同时调用拖拽
            initPath(){
                const projection = this.$d3.geoOrthographic()
                    .fitExtent([[1, 1], [500 , 500]],{type: "Sphere"})
                    .rotate([0, -50]);
                this.baseConfig.projection=projection;
                this.baseConfig.path=this.$d3.geoPath(projection).pointRadius(1);
                this.initInteractions();
            },
            initInteractions(){
                let v0, q0, r0;
                const {width,height,projection}=this.baseConfig;
                const dragStart= function(evt){
                    v0 = versor.cartesian(projection.invert([evt.x, evt.y]));
                    q0 = versor(r0 = projection.rotate());
                };
                const dragged=function(evt) {
                    const v1 = versor.cartesian(projection.rotate(r0).invert([evt.x, evt.y])); // 笛卡尔坐标系
                    const q1 = versor.multiply(q0, versor.delta(v0, v1));
                    projection.rotate(versor.rotation(q1));
                }
                const  dragAdapter=this.$d3.drag()
                    .on('start',dragStart)
                    .on('drag',dragged);
                const context=this.canvasContext;
                this.$d3.select(context.canvas).call(dragAdapter.on("drag.render", () =>{
                    context.clearRect(0, 0, width, height);
                    this.sphereRenderer();
                }));

            },
            /**
             * 定时触发render，负责旋转及线条动画绘制
             */
            initIntervalRenderer(){
                const {projection,width,height}=this.baseConfig;
                const context=this.canvasContext;
                this.$d3.interval(()=>{
                    let [needRotateAngle,...parallelAngle]=projection.rotate();
                    let batchRenderer=this.loopData.renderList.filter(d=>d.renderer).map(d=>d.renderer);
                    projection.rotate([needRotateAngle+0.25,...parallelAngle])
                    context.clearRect(0, 0, width, height);
                    this.sphereRenderer(batchRenderer);
                },25)
            },
            async initCommitsRenderer(){
                const {githubCommits}=this.rawData;
                let counterIndex=0;
                let arcList=[];
                //只要赋值一次引用应该就ok
                this.loopData.renderList=arcList;
                this.$d3.interval(()=>{
                    //回收collect态
                    this.loopData.renderList=arcList=arcList.filter(d=>d.state!=='collect');
                    if(counterIndex>=githubCommits.length-2)
                        counterIndex=counterIndex%githubCommits.length
                    counterIndex++;
                    let gitCommitObj=githubCommits[counterIndex];
                    let {gm,gop}=gitCommitObj
                    let srcCoordinate=[gop.lon,gop.lat],targetCoordinate=[gm.lon,gm.lat]
                    let geoLines = this.$d3.geoInterpolate(srcCoordinate, targetCoordinate);


                    //state内置 extend=>transfer=>shrink
                    arcList.push({srcCoordinate,targetCoordinate,geoLines,t:0,state:'extend'});
                    //可以考虑重叠canvas与svg来解决问题？

                },1000)
                //状态机maybe可以解决问题 extend 延伸态 transfer 固定态，shrink 收缩态 collect 回收态
                while (true){
                    let extendArcSnapshot=arcList.filter(d=>d.state==='extend');
                    let transferArcSnapshot=arcList.filter(d=>d.state==='transfer')
                    let shrinkArcSnapshot=arcList.filter(d=>d.state==='shrink')
                    console.log(extendArcSnapshot.length,transferArcSnapshot.length,shrinkArcSnapshot.length)
                    await Promise.all([
                        //extend延伸态 两点间线条动画延展
                        this.$d3.transition('extend')
                            .duration(10000)
                            .tween("render", () => t => {
                                extendArcSnapshot.forEach((d)=>{
                                    d.renderer={type:'LineString',coordinates:[d.srcCoordinate,d.geoLines(t)]};
                                })
                                if(t===1){
                                    extendArcSnapshot=extendArcSnapshot.forEach(d=>{
                                        d.state='transfer'
                                    })
                                }
                            })
                            .end(),
                        //transfer固定态 如果有时间还可以做一下传输特效
                        this.$d3.transition('transfer')
                            .duration(10000)
                            .delay(1000)
                            .tween("render", () => t => {
                                if(t===1){
                                    transferArcSnapshot.forEach((d)=>{
                                        d.state='shrink'
                                    })
                                }
                            })
                            .end(),
                        //shrink 收缩态，线条逐渐消失
                        this.$d3.transition('shrink')
                            .duration(5000)
                            .delay(2800)
                            .tween("render", () => t => {
                                shrinkArcSnapshot.forEach((d)=>{
                                    d.renderer={type:'LineString',coordinates:[d.geoLines(t),d.targetCoordinate]};
                                })
                                if(t===1){
                                    shrinkArcSnapshot=shrinkArcSnapshot.forEach(d=>{
                                        d.state='collect'
                                    })
                                }
                            })
                            .end()
                    ])
                }
            },
            sphereRenderer(renderList=[]){
                const {path}=this.baseConfig,graticule = this.$d3.geoGraticule10();
                const context=this.canvasContext
                const pathAdapter=path.context(context);
                const land = topojson.feature(worldAltas, worldAltas.objects.land)
                context.fillStyle='azure'
                context.beginPath();
                pathAdapter(graticule);
                context.strokeStyle = "#aaa";
                context.stroke();

                context.beginPath()
                pathAdapter(land);
                context.fillStyle = "#ccc";
                context.fill();
                if(renderList.length){
                    context.beginPath();
                    renderList.forEach((d)=>{
                        pathAdapter(d);
                    })
                    context.strokeStyle = "red";
                    context.stroke();
                }
            },
            async initGraph(){
                await this.initData();
                this.initPath();
                this.sphereRenderer();
                this.initIntervalRenderer()
                //这是个死循环，请务必放在最后
                this.initCommitsRenderer();
            }
        },
        mounted() {
            this.initGraph()
        }

    }
</script>

<style scoped>

</style>