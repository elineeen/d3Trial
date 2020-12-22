<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import * as topojson from 'topojson'
    import {usaTopoJson} from "./counties-albers-10m";
    import  * as windDatajson from './windData';
    import {Particle, VectorField} from './vectorField'
    export default {
        name: "wind",
        data(){
            return{
                baseConfig:{
                    width:1000,
                    height:1000,
                    projection:null,
                    path:null,
                    totalParticles:5000,
                },
                remote:{
                    dataField:VectorField.read(windDatajson.default, true),
                    particles:[],
                }
            }
        },
        methods:{
            initGraph(){
                this.initPath();
                this.drawArea();
                // //x: -55.25507586076571
                // //y: 40.55774706829813
                // this.remote.dataField.getValue(-55.25507586076571,40.55774706829813);
                for (let i = 0; i < this.baseConfig.totalParticles; i++) {
                    this.remote.particles.push(this.makeParticle(null));
                }

                this.initSimulation();
            },
            initSimulation(){
                let {projection}=this.baseConfig
                const nodes = this.createOrigin()
                    .attr("class", "nodes")
                    .attr("stroke", "#050")
                    .attr("stroke-width", 0)
                    .selectAll("circle")
                    .data(this.remote.particles,(d,i)=>{return i})
                    .join('g')
                    .attr('transform',(d,i)=>{
                        let projectedCoordinate=projection([d.x,d.y]);
                        return `translate(${projectedCoordinate?projectedCoordinate.join():'0,0'})`})
                    .append('circle')
                    .attr("fill", '#FFFFFF')
                    .attr("r", 1)
                //x: -55.25507586076571
                //y: 40.55774706829813
                const simulation = this.$d3.forceSimulation(this.remote.particles)
                    .alphaTarget(0.3)
                    .velocityDecay(0)
                    .force("x", this.$d3.forceX().strength((d,i)=>{ if(i===1){d.oldX=d.x;console.log(d.x)} return 0.01*this.remote.dataField.getValue(d.x,d.y).x }))
                    .force("y", this.$d3.forceY().strength((d,i)=>{return 0.01*this.remote.dataField.getValue(d.x,d.y).y }))
                    .on("tick", ()=>{
                        debugger;
                        nodes
                            .transition()
                            .attr("cx", d => d.x)
                            .attr("cy", d => d.y)
                            .duration(500)
                        simulation
                            .force("x", this.$d3.forceX().strength((d,i)=>{ if(i===1){d.oldX=d.x;console.log(d.x)}
                            try {
                                this.remote.dataField.getValue(d.x,d.y)
                            }
                            catch (e) {
                                const x=this.remote.dataField.getValue;
                                debugger;
                            }
                            return 0.01*this.remote.dataField.getValue(d.x,d.y).x }))
                            .force("y", this.$d3.forceY().strength((d,i)=>{return 0.01*this.remote.dataField.getValue(d.x,d.y).y }))
                    });
            },
            //初始化投影，根据投影生成geopath adapter，同时调用拖拽
            initPath(){
                const {width,height}=this.baseConfig;
                const projection = this.$d3.geoAlbersUsa()
                    .scale(1300).translate([487.5, 305])
                this.baseConfig.projection=projection;
                this.baseConfig.path=this.$d3.geoPath(projection);
            },
            drawArea(){
                const {path}=this.baseConfig,x=usaTopoJson;
                this.createOrigin().append("path")
                    .datum(topojson.feature(usaTopoJson, usaTopoJson.objects.nation))
                    .attr("fill", "#000")
                    .attr("d", this.$d3.geoPath());
                    // .attr("class", "sphere")
                    // .attr("d", path)
                    // .style("fill", "#000")
                    // .style("stroke", "#000")
                    // .style("stroke-width", "0.5px")
            },
            //svg背景要去除fill，否则会有黑边
            createOrigin(){
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(0,0)`);
                return origin;
            },
            makeParticle(animator) {
                var dx = animator ? animator.dx : 0;
                var dy = animator ? animator.dy : 0;
                var scale = animator ? animator.scale : 1;
                var safecount = 0;
                let {dataField}=this.remote,{x0,x1,y0,y1}=dataField
                for (;;) {
                    var a = Math.random();
                    var b = Math.random();
                    var x = a * x0 + (1 - a) * x1;
                    var y = b * y0 + (1 - b) * y1;
                    var v = dataField.getValue(x, y);
                    if (dataField.maxLength == 0) {
                        return new Particle(x, y, 1 + 40 * Math.random());
                    }
                    var m = v.length() / dataField.maxLength;
                    // The random factor here is designed to ensure that
                    // more particles are placed in slower areas; this makes the
                    // overall distribution appear more even.
                    if ((v.x || v.y) && (++safecount > 10 || Math.random() > m * .9)) {
                        // var proj = this.projection.project(x, y);
                        // var sx = proj.x * scale + dx;
                        // var sy = proj.y * scale + dy;
                        // if (++safecount > 10 || !(sx < 0 || sy < 0 || sx > this.canvas.width || sy > this.canvas.height)) {
                            return new Particle(x, y, 1 + 40 * Math.random());
                        // }
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

</style>