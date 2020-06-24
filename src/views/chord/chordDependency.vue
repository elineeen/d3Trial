<template>
    <svg class="circular-graph" width=800 height=800></svg>
</template>

<script>
    import {dependencyData} from "./data";
    import * as d3 from 'd3';
    export default {
        name: "chordDependency",
        data(){
            return {
                adaptedData:{
                    matrix:[],
                    indexByName:new Map(),
                    nameByIndex:new Map()
                },
                dataAdapter:{
                    chordAdapter:d3.chord()
                        .padAngle(0.05)
                        //一级分组排序
                        .sortGroups(d3.ascending)
                        //matrix二级分组排序
                        .sortSubgroups(d3.descending),
                },
                baseConfig:{
                    width:800,
                    height:800,
                    color:d3.scaleOrdinal(d3.schemeCategory10),
                    innerRadius:200,
                    outerRadius:220,
                }

            }
        },
        methods:{
            createGroupOrigin(){
                const {width,height}=this.baseConfig;
                let origin=d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(${width/2},${height/2})`);
                    // .attr('transform','translate('+width+','+height+')')
                return origin;
            },
            initGraph(){
                this.adaptRawData(dependencyData);
                this.initChord();
                this.drawAxis();
            },
            initChord(){
                const {color,innerRadius}=this.baseConfig,{chordAdapter}=this.dataAdapter,
                    ribbon = d3.ribbon()
                    .radius(innerRadius);
                this.createGroupOrigin()
                    .attr("fill-opacity", 0.67)
                    .selectAll("path")
                    .data(chordAdapter(this.adaptedData.matrix))
                    .join("path")
                    .attr("d", ribbon)
                    .attr("fill", d =>{ return color(d.source.index)})
                    // .attr("stroke", d => d3.rgb(color(d.source.index)).darker());
            },
            //axis分为两部分，一部分arc边框，一部分复现字体
            drawAxis(){
                const {color,outerRadius,innerRadius}=this.baseConfig,{chordAdapter}=this.dataAdapter,
                    {nameByIndex}=this.adaptedData,
                    wrapArc= d3.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius);
                debugger;
                const group=this.createGroupOrigin()
                    .selectAll('g')
                    .data(chordAdapter(this.adaptedData.matrix).groups)
                    .join('g')
                    .attr('class','dataGroup');
                group.append('path')
                    .attr("fill", d => color(d.index))
                    // .attr("stroke", d => d3.rgb(color(d.index)).darker())
                    .attr('d',wrapArc);
                group
                    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2})
                    .append('g')
                    .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`)
                    .attr('class','groupText')
                    .append("text")
                    .attr("y", ".35em")
                    .attr("transform", d => d.angle > Math.PI ? "rotate(180)" : null)
                    .attr("text-anchor",  d => d.angle > Math.PI ? "end" : null)
                    .text(d => nameByIndex.get(d.index));
            },
            //适配data，返回矩阵和两个索引map
            adaptRawData(dependencyDataList){
                const{indexByName,nameByIndex,matrix}=this.adaptedData;
                let n = 0;

                // 数据字段掐头去尾，返回中间内容
                function name(name) {
                    return name.substring(0, name.lastIndexOf(".")).substring(name.indexOf(".")+1);
                }

                // 注入两个map，一个顺序存储对象name，一个根据name存储对应顺序,重复name不录入......
                dependencyDataList.forEach(d => {
                    if (!indexByName.has(d = name(d.name))) {
                        nameByIndex.set(n, d);
                        indexByName.set(d, n++);
                    }
                });
                // 构建弦图矩阵
                dependencyDataList.forEach(d => {
                    const rowIndex = indexByName.get(name(d.name));
                    let row = matrix[rowIndex];
                    //row初始化
                    if (!row) row = matrix[rowIndex] = Array.from({length: n}).fill(0);
                    d.imports.forEach(importData => row[indexByName.get(name(importData))]++);
                });

            }
        },
        mounted(){
            this.initGraph()
        }
    }
</script>

<style scoped>

</style>