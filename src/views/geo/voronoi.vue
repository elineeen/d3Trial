<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import {geoVoronoi,geoDelaunay} from 'd3-geo-voronoi'
    import * as versor from  './versor'
    export default {
        name: "voronoi",
        data(){
            return {
                baseConfig:{
                    width:1000,
                    height:1000,
                    projection:null,
                    path:null,
                },
                //该实例用于drag事件
                instance:{
                    voronoiLink:null,
                    points:null
                },
                sphereRenderCounter:0,
            }
        },
        methods:{
            initGraph(){
                this.initPath();
                this.drawSphere();
                this.drawVoroni();
                // this.initDrag()
            },
            /**
             *     初始化drag函数，使用versor计算旋转角度(这里直接找的外部js，具
             *     体原理并不是很懂)在拖拽渲染时重新绘制图形
             */
            initDrag(projection){
                debugger;
                let v0, q0, r0;
                const d3Instance=this.$d3;
                // const {projection}=this.baseConfig;
                const dragStart= function(){
                    let evt=d3Instance.event;
                    v0 = versor.cartesian(projection.invert([evt.x, evt.y]));
                    q0 = versor(r0 = projection.rotate());
                };
                const dragged=function() {
                    let evt=d3Instance.event;
                    const v1 = versor.cartesian(projection.rotate(r0).invert([evt.x, evt.y])); // 笛卡尔坐标系
                    const q1 = versor.multiply(q0, versor.delta(v0, v1));
                    console.dir(versor.rotation(q1));
                    projection.rotate(versor.rotation(q1));
                }
                const  dragAdapter=this.$d3.drag()
                    .on('start',dragStart)
                    .on('drag',dragged);
                this.$d3.select("svg").call(dragAdapter.on("drag.render", () =>{
                    this.clearGraph();
                    this.drawSphere();
                    this.updateGraph();
                }));

            },
            //初始化投影，根据投影生成geopath adapter，同时调用拖拽
            initPath(){
                const {width,height}=this.baseConfig;
                const projection = this.$d3.geoOrthographic()
                    .fitExtent([[1, 1], [width , height]],{type: "Sphere"})
                    .rotate([0, -50]);
                this.baseConfig.projection=projection;
                this.baseConfig.path=this.$d3.geoPath(projection).pointRadius(1);
                this.initDrag(projection);
            },
            //svg背景要去除fill，否则会有黑边
            createOrigin(){
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(0,0)`);
                return origin;
            },
            drawSphere(){
                const {path}=this.baseConfig,graticule = this.$d3.geoGraticule10();
                this.createOrigin().append("path")
                    .attr("class", "sphere")
                    .attr("d", path(graticule));
            },
            async drawVoroni(){
                this.instance.points =await this.$d3.csv("https://gist.githubusercontent.com/mbostock/b5c3549cbe0a68649f87952b73d9983c/raw/631e77d2f2724d0d4b35dd9bb3a25b8c09d4a622/airports.csv",
                    ({longitude, latitude}) => [+longitude, +latitude]),
                this.instance.voronoiLink=geoVoronoi(this.instance.points).mesh();
                this.updateGraph();
            },
            clearGraph(){
                this.$d3.select('svg').selectAll('path').remove();
            },
            updateGraph(){
                const {path}=this.baseConfig,
                    {points,voronoiLink}=this.instance;

                //在投影上画点的方式也可以通过geocircle方式绘制实现，但是如果应用于旋转由于元素较多
                // 会有较严重的卡顿，不如multipoint性能好
                // circle=this.$d3.geoCircle();

                //按照覆盖顺序先画线
                this.createOrigin().append('path')
                    .attr('class','graph voronoi-link')
                    .attr('d',path(voronoiLink))
                this.createOrigin().append('path')
                    .datum({
                            "type":"MultiPoint",
                            "coordinates":points
                    })
                    .attr("d", path)
                    .attr('class','point')
                // this.createOrigin().selectAll('points').data(points).join('path')
                //     .attr("class", "graph point")
                //     .attr('d', (d,i)=>{
                //         return path(circle.center(d).radius(0.2)())
                //     })
            }
        },
        mounted(){
            this.initGraph()
        }
    }
</script>

<style scoped lang="scss">
    svg{
        fill:none;
        ::v-deep{
            .sphere {
                fill: none;
                stroke: lightgrey;
            }
            .point{
                stroke:red;
                fill: red;
            }
            .voronoi-link{
                stroke-width: 1px;
                stroke: lightblue;
            }
        }
    }

</style>