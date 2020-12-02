<template>
    <v-container>
        <v-row>
            you can change the simulation config to perform different behaviors of these particles
        </v-row>
        <v-row >
            <v-btn text  small @click="setMode('followMode')">setFollowMode</v-btn>
            <v-btn text small @click="setMode('collisionMode')">setCollisionMode</v-btn>
        </v-row>
        <svg  :width=baseConfig.width :height=baseConfig.height></svg>
    </v-container>

</template>

<script>


    export default {
        name: "collision-detection",
        data(){
            return {

                baseConfig:{
                    width:500,
                    height:500,
                },
                simulationData:{
                    simulation:null,
                    nodes:null,
                },
                simulationInstance:null,
                nodeList:[]
            }
        },
        methods:{
            setMode(modeName){
                const simulationConfig={
                    followMode:{
                        collide:this.$d3.forceCollide().radius(d => d.r + 1).iterations(3),
                        //distanceinMin，该值可以防止两个节点过近产生的无向的无穷受力
                        charge:this.$d3.forceManyBody().strength((d, i) => i ? 0 : 1000).distanceMin(100)
                    },
                    collisionMode:{
                        collide:this.$d3.forceCollide().radius(d => (d.r + 1)).iterations(3),
                        // 受力负值可以赋予原点与其周围发生一个斥力关系
                        charge:this.$d3.forceManyBody().strength((d, i) => i ? 0 : -this.baseConfig.width * 2 / 3)
                    }
                }
                let {simulation}=this.simulationData,mode=simulationConfig[modeName];
                if(mode){
                    simulation
                        .force("collide", mode["collide"])
                        .force("charge", mode["charge"])
                }
            },
            _pointed(){
                debugger
                const {width,height}=this.baseConfig;
                const {offsetX, offsetY} = this.$d3.event;
                this.nodeList[0].fx = offsetX - width / 2;
                this.nodeList[0].fy = offsetY - height / 2;
            },
            createGroupOrigin(){
                const {width,height}=this.baseConfig;
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(${width/2},${height/2})`);
                return origin;
            },
            initGraph(){
                let {width}=this.baseConfig;
                const colorAdapter=this.$d3.scaleOrdinal(this.$d3.range(4), ["transparent"].concat(this.$d3.schemeTableau10))
                const nodes = this.createGroupOrigin()
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5)
                    .selectAll("circle")
                    .data(this.nodeList,(d)=>{return d.index})
                    .join(
                        enter => enter.append("circle"),
                        update => update.attr("fill", "blue"),
                        exit => exit.remove()
                    )
                    .attr("fill", (d)=>colorAdapter(d.group))
                    .attr("r", d=>d.r)
                const simulation = this.$d3.forceSimulation(this.nodeList)
                    .alphaTarget(0.3) // stay hot
                    .velocityDecay(0.2) // low friction
                    .force("x", this.$d3.forceX().strength(0.01))
                    .force("y", this.$d3.forceY().strength(0.01))
                    .force("collide", this.$d3.forceCollide().radius(d => d.r + 1).iterations(3))
                    .force("charge", this.$d3.forceManyBody().strength((d, i) => i ? 0 : 1000).distanceMin(100))
                    .on("tick", ()=>{
                        nodes
                            .attr("cx", d => d.x)
                            .attr("cy", d => d.y)
                    });
                this.$d3.select("svg")
                    .on("touchmove", event => event.preventDefault())
                    .on("pointermove", this._pointed);
                this.simulationData={nodes,simulation}
            },
            initData(){
                let {width}=this.baseConfig
                const k = width / 200;
                const r = this.$d3.randomUniform(k, k * 4);
                let dataAdapter=Array.from({length: 200}, (_, i) => ({r: r(), group: i && (i % 4 + 1)}));
                this.nodeList=dataAdapter.map(Object.create)
            }
        },
        mounted() {
            this.initData();
            this.initGraph()
        }
    }
</script>

<style scoped>
    svg{
        border: 1px solid lightgray;
    }
</style>