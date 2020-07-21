<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import {barChartData} from "./data";

    export default {
        name: "barChart",
        data(){
            return {
                baseConfig:{
                    width:1000,
                    height:500,
                    margin:{
                        top: 10,
                        right: 10,
                        bottom: 20,
                        left: 40
                    }
                },
                scale:{
                    x:null,
                    y:null,
                    color:null
                },
                series:[]
            }
        },
        methods:{
            initGraph(){
                this.initSeries();
                this.initScale();
                this.drawAxis();
                this.drawBars();
            },
            initSeries(){
                let keyList=Object.keys(barChartData[0]).slice(1);
                keyList.pop();
                 let stackAdapter= this.$d3.stack()
                    .keys(keyList);
                this.series=stackAdapter(barChartData).map(d => (d.forEach(v => v.key = d.key), d))
            },
            initScale(){
                const {margin,width,height}=this.baseConfig;
                this.scale.x=this.$d3.scaleBand()
                    .domain(barChartData.map(d => d.name))
                    .range([0, width - margin.right-margin.left])
                    .padding(0.1);
                //为了使用同一origin进行位移，y轴range要设置成负值
                this.scale.y= this.$d3.scaleLinear()
                    .domain([0, this.$d3.max(barChartData, d => {return d.total})])
                    .rangeRound([0,-(height - margin.bottom-margin.top)]);
                this.scale.color=this.$d3.schemeSpectral[Object.keys(barChartData[0]).slice(1).length];

            },
            getOrigin(){
                const {bottom,left}=this.baseConfig.margin,{height}=this.baseConfig;;
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(${left},${height-bottom})`);
                return origin;
            },
            drawAxis(){
                const {x,y}=this.scale;
                let xAxis=this.$d3.axisBottom(x),yAxis=this.$d3.axisLeft(y).ticks(20,'s');
                this.getOrigin().call(xAxis);
                this.getOrigin().call(yAxis);
            },
            drawBars(){
                const {x,y,color}=this.scale;
                this.series.forEach((groupData,index)=>{
                    this.getOrigin().selectAll('rectBars')
                        .data(groupData)
                        .join('rect')
                        .attr('x',(rectData)=>{ return x(rectData.data.name)})
                        .attr('y',(rectData)=>{return y(rectData[1])})
                        .attr('width',x.bandwidth)
                        .attr('height',(rectData)=>{return y(rectData[0])-y(rectData[1])})
                        .attr('fill',((d)=>{return color[index] }))
                })

            },
        },
        mounted(){
            this.initGraph()
        }

    }
</script>

<style scoped>

</style>