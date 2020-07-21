<template>
    <v-container>
        <v-row>
            left-click to delete a node and its related link
        </v-row>
        <v-row>
            <v-btn text small @click="tickSimulation">nextTick</v-btn>
            <v-btn text small @click="setGridLayout">reset2GridLayout</v-btn>
            <v-btn text small @click="setTreeLayout">reset2TreeLayout</v-btn>
        </v-row>
        <svg  :width=baseConfig.width :height=baseConfig.height></svg>

    </v-container>

</template>
<script>
    import {forceTreeLayoutData} from "./data";
    export default {
        name: "forceLayout",
        data(){
            return {
                baseConfig:{
                    width:500,
                    height:500,
                },
                simulationData:{
                    simulation:null,
                    node:null,
                    link:null
                },
                simulationInstance:null
            }
        },
        methods:{
            setTreeLayout(){
                this.simulationData=this.initGraph(1);
                const {simulation}=this.simulationData;
                simulation.tick(0).restart();
            },
            setGridLayout(){
                this.simulationData=this.initGraph(0);
                const {simulation}=this.simulationData;
                simulation.tick().restart();
            },
            //restart只是继续模拟过程，不会重新开始simulation，tick决定下一步simulation的跨度，默认max300
            tickSimulation(){
                this.simulationData.simulation.tick(10).restart();
            },
            createGroupOrigin(){
                const {width,height}=this.baseConfig;
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(${width/2},${height/2})`);
                return origin;
            },
            clearGraph(){
                this.$d3.select("svg").selectAll("line").remove();
                this.$d3.select("svg").selectAll("circle").remove()
            },
            initGraph(strength=1){
                this.clearGraph();
                const root = this.$d3.hierarchy(_.cloneDeep(forceTreeLayoutData));
                const links = root.links();
                const nodes = root.descendants();
                //初始化模拟参数
                const simulation = this.$d3.forceSimulation(nodes)
                    .force("link", this.$d3.forceLink(links).id(d => d.id).distance(0).strength(strength))
                    .force("charge", this.$d3.forceManyBody().strength(-50))
                    .force("x", this.$d3.forceX())
                    .force("y", this.$d3.forceY())
                    .stop();
                //设置监听tick执行变更后停止执行
                simulation.on("tick", () => {
                    link
                        .transition()
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y)
                        .duration(500)

                    node
                        .transition()
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y)
                        .duration(500)
                    simulation.stop();
                });
                const link = this.createGroupOrigin()
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .selectAll("line")
                    .data(links,(d)=>{return d.index})
                    .join("line");

                const node = this.createGroupOrigin()
                    .attr("fill", "#fff")
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1.5)
                    .selectAll("circle")
                    .data(nodes,(d)=>{return d.index})
                    .join(
                        enter => enter.append("circle"),
                        update => update.attr("fill", "blue"),
                        exit => exit.remove()
                    )
                    .attr("fill", d => d.children ? null : "#000")
                    .attr("stroke", d => d.children ? null : "#fff")
                    .attr("r", 3.5)
                    .on('click',(e)=>{
                        this._removeNodes(e)
                        this._removeRelatedLinks(e)
                    })
                return {simulation,node,link}
            },
            _removeNodes(removeNode){
                const {node}=this.simulationData;
                let ft=node.data().filter((data)=>{
                    return data!=removeNode;
                })
                node.data(ft,(d)=>{return d.index}).exit().remove();
            },
            _removeRelatedLinks(removeNode){
                const {link}=this.simulationData;
                let ft=link.data().filter((data)=>{
                    return ![data.source.index,data.target.index].includes(removeNode.index);
                })
                link.data(ft,(d)=>{return d.index}).exit().remove();
            }
        },
        mounted(){
             this.simulationData=this.initGraph();
            // simulation.restart();
        }
    }
</script>

<style scoped>

</style>