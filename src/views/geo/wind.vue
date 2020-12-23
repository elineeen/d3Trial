<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import * as topojson from 'topojson'
    import {usaTopoJson} from "./counties-albers-10m";
    import  * as windDatajson from './windData';
    import {Particle, Vector, VectorField} from './vectorField'
    export default {
        name: "wind",
        data(){
            return{
                baseConfig:{
                    width:1000,
                    height:800,
                    projection:null,
                    path:null,
                    totalParticles:3000,
                    //网太烂打开不了github的图片，查不到d3的调色器interpolate文档，只能手写了
                    colorPalette:new Array(255).fill(0).map((d,i)=>{
                        return  'rgb(' + i + ',' + i + ',' + i + ')';
                    })
                },
                remote:{
                    dataField:VectorField.read(windDatajson.default, true),
                    particles:[],
                }
            }
        },
        methods:{
            initGraph(){
                // this.initConfig()
                this.initPath();
                this.drawArea();
                this.initSimulation();
            },
            initSimulation(){
                let {projection}=this.baseConfig;
                for (let i = 0; i < this.baseConfig.totalParticles; i++) {
                    this.remote.particles.push(this.makeParticle(null));
                }
                const links = this.createOrigin()
                    .attr("class", "links")
                    .selectAll("link")
                    .data(this.remote.particles)
                    .join('g')
                        .append('line')
                        .attr('class','move-links')
                        .style("stroke-width", 1)
                        .attr("stroke", "#fff")
                const simulation = this.$d3.forceSimulation(this.remote.particles)
                    .alphaTarget(0.99)
                    // .velocityDecay(0)
                    .on("tick", ()=>{
                        simulation.stop();
                    });
                this.$d3.interval(()=>{
                    // this.drawArea();
                    //重新计算每个点是否在边界与生命周期内，否则重新生成新粒子
                    for (let i = 0; i < this.remote.particles.length; i++) {
                        let p = this.remote.particles[i];
                        if (p.age > 0 && this.remote.dataField.inBounds(p.x, p.y)) {
                            p.age--;
                            p.v=this.remote.dataField.getValue(p.x,p.y)
                        } else {
                            this.remote.particles[i] = this.makeParticle(null);
                        }
                    }
                    //vector 复用于着色信息
                    let colorVector=new Vector(0,0)
                    links
                        .data(this.remote.particles)
                        .attr('transform',(d,i)=>{
                            let projectedCoordinate=projection([d.x,d.y]);
                            return `translate(${projectedCoordinate?projectedCoordinate.join():'0,0'})`})
                        .attr("x1", d => d.x)
                        .attr("y1", d => d.y)
                        .attr("x2", d => d.oldX===-1?d.x:d.oldX)
                        .attr("y2", d => d.oldY===-1?d.y:d.oldY)
                        .attr("stroke", d=>{
                            let wind = d.v;
                            if(wind){
                                var s = wind.length() / this.remote.dataField.maxLength;
                                let c = 90 + Math.round(350 * s); // was 400
                                if (c > 255) {
                                    c = 255;
                                }
                                return this.baseConfig.colorPalette[c];
                            }
                            else
                                return '#050'

                        })
                    simulation
                        .nodes(this.remote.particles)
                        .force("x", this.$d3.forceX().strength((d,i)=>{
                            d.oldX=d.x;
                            return 0.001*d.v.x
                        }))
                        .force("y", this.$d3.forceY().strength((d,i)=>{
                            d.oldY=d.y;
                            return 0.001*d.v.y
                        }))
                    simulation.restart();
                },10)
            },
            //初始化投影，根据投影生成geopath adapter，同时调用拖拽
            initPath(){
                const {width,height}=this.baseConfig;
                const projection = this.$d3.geoAlbersUsa()
                    //没看懂他原来的手写投影的偏移，只能自己大概写写套一套
                    .scale(width).translate([487.5,255])
                this.baseConfig.projection=projection;
                this.baseConfig.path=this.$d3.geoPath(projection);
            },
            drawArea(){
                const {path}=this.baseConfig,x=usaTopoJson;
                this.createOrigin().append("path")
                    .datum(topojson.feature(usaTopoJson, usaTopoJson.objects.nation))
                    .attr("fill", "#000")
                    .attr('fill-opacity','1')
                    .attr("d", this.$d3.geoPath());
            },
            //svg背景要去除fill，否则会有黑边
            createOrigin(){
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(0,0)`);
                return origin;
            },
            makeParticle(animator) {
                const {width,height,projection}=this.baseConfig;
                var dx = animator ? animator.dx : 0;
                var dy = animator ? animator.dy : 0;
                var scale = 1;
                var safecount = 0;
                let {dataField}=this.remote,{x0,x1,y0,y1}=dataField
                for (;;) {
                    var a = Math.random();
                    var b = Math.random();
                    var x = a * x0 + (1 - a) * x1;
                    var y = b * y0 + (1 - b) * y1;
                    var v = dataField.getValue(x, y);
                    if (dataField.maxLength == 0) {
                        return new Particle(x, y, 1 + 40 * Math.random(),v);
                    }
                    var m = v.length() / dataField.maxLength;
                    // The random factor here is designed to ensure that
                    // more particles are placed in slower areas; this makes the
                    // overall distribution appear more even.
                    if ((v.x || v.y) && (++safecount > 10 || Math.random() > m * .9)) {
                        var proj = projection([x, y]);
                        if(proj){
                            var sx = proj[0] * scale + dx;
                            var sy = proj[1] * scale + dy;
                            if (++safecount > 10 || !(sx < 0 || sy < 0 || sx > width || sy > height)) {
                                return new Particle(x, y, 1 + 40 * Math.random(),v);
                            }
                        }
                    }
                }
            }
        },
        mounted() {
            this.initGraph();
        }
    }
</script>

<style scoped>
    .move-links{
        stroke-width: 1px;
        stroke: lightblue;
    }
</style>