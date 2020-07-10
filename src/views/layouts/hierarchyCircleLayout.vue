<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import {adaptedData} from "./data";

    export default {
        name: "hierarchyCircleLayout",
        data(){
            return {
                baseConfig:{
                    width:800,
                    height:800,
                    color:this.$d3.scaleSequential(this.$d3.interpolateRdYlBu),
                }
            }
        },
        methods:{
            initGraph(){
                this.drawTree()
            },
            initTreeData(){
                const {width,height}=this.baseConfig
                let hierarchyEl=this.$d3.hierarchy(adaptedData);
                return this.treeAdapter(hierarchyEl)
                 //    .sort((a, b) => this.$d3.ascending(a.height, b.height) || this.$d3.ascending(a.data.name, b.data.name))
            },
            drawTree(){
                const {width,height,color}=this.baseConfig,treeData=this.initTreeData();
                //之所以用cluster不用tree是因为cluster所有叶节点都在相同的深度上
                let cluster= this.$d3.cluster()
                    //height为360度分割，之后作为旋转角度
                    .size([360, width/2 - 100]),
                treeEL=cluster(treeData);
                debugger;
                const node =
                    this.createGroupOrigin()
                        .attr("font-family", "sans-serif")
                        .attr("font-size", 8)
                        .attr('ling-height',20)
                        .selectAll("g")
                        .data(treeEL.leaves())
                        .join("g")
                        .attr("transform", d => `rotate(${d.x-90 }) translate(${d.y},0)`)
                        .append("text")
                        .attr("dy", "0.31em")
                        .attr("x", d => d.x < 180 ? 6 : -6)
                        .attr("text-anchor", d => d.x < 180 ? "start" : "end")
                        .attr("transform", d => d.x >=180 ? "rotate(180)" : null)
                        .text(d => d.data.name);
                const curveLine=this.$d3.lineRadial()
                    .curve(this.$d3.curveBundle.beta(0.85))
                    .angle(d =>{return (d.x/180)*Math.PI*2})
                    .radius(d => d.y)
                const link =   this.createGroupOrigin()
                    .attr("stroke", '#ccc')
                    .attr("fill", "none")
                    .selectAll("path")
                    .data(treeEL.leaves()
                        .flatMap(leaf => leaf.outgoing)
                    )
                    .join("path")

                    .style("mix-blend-mode", "multiply")
                    //node.path方法，返回两点之间的路径...用这个路径画曲线，太艹了，把curve属性去掉就知道真相
                    .attr("d",([i,o])=>{ return curveLine(i.path(o))})
                    //大概是为了响应hover标记用数据？
                    // .each(function(d) { debugger; d.path = this; });
                debugger;
            },
            createGroupOrigin(){
                const {width,height}=this.baseConfig;
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(${width/2},${height/2})`);
                return origin;
            },
            /**
             * 为d3的hierarchy元素的每个叶节点添加incoming和outGoing，每个incoming和outGoing都是一个node pair
             * @param root
             * @returns {*}
             */
            treeAdapter(root) {
                const id=function(node) {
                    return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
                }
                const map = new Map(root.leaves().map(d => [id(d), d]));
                //遍历设置outgoing
                for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.imports.map(i => [d, map.get(i)]);
                //直接找到每个leave的outgoing节点并插入对应的incoming
                for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
                return root;
            }
        },
        mounted(){
            this.initGraph();
        }
    }
</script>

<style scoped>

</style>