<template>
    <svg class="circular-graph" width=550 height=550></svg>
</template>

<script>
    import * as d3 from 'd3';
    import {legendColor} from "d3-svg-legend";
    import {officialChordData} from "./data";
    export default {
        name: "officialExample",
        data(){
          return {
              baseConfig:{
                  color:d3.scaleOrdinal()
                      .domain(d3.range(4))
                      .range(["#000000", "#FFDD89", "#957244", "#F26223"]),
                  innerRadius:180,
                  outerRadius:200,
              },
              dataAdapter:{
                  chordAdapter:d3.chord()
                      .padAngle(0.05)
                      //一级分组排序
                      .sortGroups(d3.ascending)
                      //matrix二级分组排序
                      .sortSubgroups(d3.descending),
              }

          }
        },
        methods:{
            initGraph(){
                this.initChord();
                this.drawTickAxis();
            },
            //axis 由两部分组成，wrap的arc部分以及刻度tick
            drawTickAxis(){
                const {color,outerRadius,innerRadius}=this.baseConfig,{chordAdapter}=this.dataAdapter,
                    wrapArc= d3.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
                const group=this.createGroupOrigin()
                    .selectAll('g')
                    .data(chordAdapter(officialChordData).groups)
                    .join('g')
                    .attr('class','dataGroup');
                group.append('path')
                    .attr("fill", d => color(d.index))
                    .attr("stroke", d => d3.rgb(color(d.index)).darker())
                    .attr('d',wrapArc);
                //设置坐标group
                const tickG=
                    group.selectAll('g')
                    .data(d => this._axisTick(d, 1e3))
                    .join("g")
                    .attr('class','ticks')
                    //从右侧边界出发旋转360度得到的g区域...数学不好还是老老实实写xyscale然后映射吧
                    .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);
                const line=tickG.append("line")
                    .attr("stroke", "#000")
                    .attr("x2", 6);
                const formatValue= d3.formatPrefix(",.0", 1e3)
                const text=tickG.filter(d => d.value % 5e3 === 0)
                    .append("text")
                    .attr("x", 8)
                    .attr("dy", ".35em")
                    .attr("transform-origin","4% 0")
                    //这个字的位置超过180度后居然是拼出来的.....
                    .attr("transform", d => d.angle > Math.PI ? "rotate(180)" : null)
                    .attr("text-anchor",  null)
                    .text(d => formatValue(d.value));
            },
            _axisTick(d,step){
                let angleSplitScale=d3.scaleLinear()
                    .range([d.startAngle,d.endAngle])
                    .domain([0,d.value])
                //切割group的value值，按1000的区域分割
                return d3.range(0, d.value, step).map(value => {
                    return {value: value, angle: angleSplitScale(value)};
                });
            },
            initChord(){
                const {color,innerRadius}=this.baseConfig,{chordAdapter}=this.dataAdapter,
                    ribbon = d3.ribbon()
                        .radius(innerRadius)
                this.createGroupOrigin()
                    .attr("fill-opacity", 0.67)
                    .selectAll("path")
                    .data(chordAdapter(officialChordData))
                    .join("path")
                    .attr("d", ribbon)
                    .attr("fill", d => color(d.target.index))
                    .attr("stroke", d => d3.rgb(color(d.target.index)).darker());
            },
            createGroupOrigin(){
                const {chordAdapter}=this.dataAdapter;
                let origin=d3.select("svg")
                    .append("g")
                    .attr('transform','translate(250,250)')
                    // .data(chordAdapter(officialChordData))
                return origin;
            }
        },
        mounted(){
            this.initGraph();
        }
    }
</script>

<style scoped>

</style>