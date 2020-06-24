
<template>
    <svg class="circular-graph" width=960 height=500></svg>
</template>

<script>
    import * as d3 from 'd3';
    import {legendColor} from "d3-svg-legend";
    import {nyJson, weatherData,baseConfig} from "./d3ChartData";
    import {circularBrush} from "./circularBrush";
    export default {
        name: "d3trial",
        data(){
          return {
              svg:null,
              scaleConfig:{},
              customWidgets:{
                    circularBrush:new circularBrush()
              },
              scaledData:{
                  freezeBars : [],
                  rainBars : [],
                  cloudBars : [],
              }


          }
        },
        methods:{
            getSideBarOrigin(){
                let origin=d3.select("svg").append("g")
                    .attr("class", "linear")
                    .attr("transform", "translate(40,350)");
                this.getSideBarOrigin=function () {
                    return origin
                };
                return this.getSideBarOrigin();
            },
            //返回极坐标使用的scale
            initScale(){
                let {height,margin}=baseConfig;
                const angleScale = d3.scaleLinear()
                        .range([0, 360]).domain([0,nyJson.values.length-1]),
                    rScale = d3.scaleLinear().domain([-10, 110]).range([0, height/2 - margin]),
                    yScale = function (day, temp) {return -Math.cos(angleScale(day)*Math.PI/180)*rScale(parseInt(temp))},
                    xScale = function (day, temp) {return Math.sin(angleScale(day)*Math.PI/180)*rScale(parseInt(temp))};
                this.scaleConfig=Object.freeze({
                    rScale,angleScale,yScale,xScale
                });
                return this.scaleConfig
            },
            initGraph(){
                let {height,width}=baseConfig;
                this.svg= d3.select('svg');
                const scaleConfig=this.initScale();
                this.loadLegends();
                this.loadRecord(nyJson);

                this.setAxis(nyJson,scaleConfig);
                this.loadBars(weatherData);
                this.drawBrush();
            },
            //图中心点创建新元素
            createOrigin(x,y){
                let {height,width}=baseConfig;
                return   this.svg.append('g')
                  .attr('transform', 'translate(' + (x||(width*3/5)) + ',' + (y||(height/2)) + ')');
            },
            loadLegends(){
                var legendScale = d3.scaleOrdinal()
                    .domain(['Record', 'Average', 'This Year - within avg', 'This Year - beyond avg', 'Freezing', 'Precipitation', 'Scattered Clouds', "Cloudy", "Overcast"])
                    .range(['record', 'avg', 'beyond', 'year', 'freeze', 'rain', 'scattered', 'cloudy', 'overcast'])
                let d3legend =new legendColor()
                    .shapePadding(5)
                    .useClass(true)
                    .scale(legendScale);
                this.svg.append('g')
                    .attr('transform', 'translate(30,120)')
                    .call(d3legend);
            },
            //处理rawBarData-》调用drawBars，由于barData在后面还会被画侧面子图使用，所以应拆分
            loadBars(data) {
                const {freezeBars,rainBars,cloudBars}=this.scaledData;
                let freeze = {},
                cloud = {start: data[0].date, category: data[0].cloud},
                rain = {},
                dateScale = d3.scaleTime().domain([new Date("01/01/2015"), new Date("12/31/2015")]).range([1,366]);
                //set startInt&endInt
                data.forEach((d, i)=>{
                    if (d.cloud !== cloud.category) {
                        cloud.end = d.date;
                        cloud.endInt = dateScale(new Date(d.date));
                        cloudBars.push(cloud);
                        cloud = {start: d.date, startInt: dateScale(new Date(d.date)), category: d.cloud};
                    }
                    if (freeze.start && !d.freeze) {
                        freeze.end = d.date;
                        freeze.endInt = dateScale(new Date(d.date));
                        freezeBars.push(freeze);
                        freeze = {};
                    }
                    else if (d.freeze && !freeze.start) {
                        freeze.start = d.date;
                        freeze.startInt = dateScale(new Date(d.date));
                    }
                    if (rain.start && !d.rain) {
                        rain.end = d.date;
                        rain.endInt = dateScale(new Date(d.date));
                        rainBars.push(rain);
                        rain = {};
                    }
                    else if (d.rain && !rain.start) {
                        rain.start = d.date;
                        rain.startInt = dateScale(new Date(d.date));
                    }
                });
                this.drawBars(rainBars, "rain", 205);
                this.drawBars(freezeBars, "freeze",200);
                this.drawBars(cloudBars, "cloud", 210);
                // drawBrush();
            },
            drawBars(data, type, offset) {
                let dateScale = d3.scaleLinear()
                    .domain([1,366])
                    .range([0,(2 * Math.PI)]);
                var arc = d3.arc().innerRadius(offset).outerRadius(offset + 5);
                this.createOrigin()
                    .attr("class", type + "bars")
                    .selectAll("path")
                    .data(data)
                    .enter()
                    .append("path")
                    .attr("d", drawArc)
                    .attr("class", (d)=> { return d.category||type});
                function drawArc(d){
                    const projected = {startAngle: dateScale(d.startInt), endAngle: dateScale(d.endInt) };
                    return arc(projected);
                }
            },
            loadRecord(data){
                //record low and high
                this.drawRadial( 'record', data.values, 'recLow', 'recHigh')
                //avg low and high
                this.drawRadial( 'avg', data.values, 'avgLow', 'avgHigh');
                var thisYear = data.values.filter(function (d) {return d.min });

                this.drawRadial( 'year', thisYear, 'min', 'max')
                var lowLower = data.values.filter(function (d) {return d.min && parseInt(d.min) < parseInt(d.avgLow)});
                this.drawRadial('yearLow', lowLower, 'min', 'avgLow')

                var highHigher = data.values.filter(function (d) {return d.min && parseInt(d.max) > parseInt(d.avgHigh)});
                this.drawRadial('yearHigh', highHigher, 'max', 'avgHigh')


            },
            drawRadial( cl, data, low, high){
                const {rScale,angleScale,yScale,xScale}=this.scaleConfig;
                this.createOrigin().selectAll('line.' + cl)
                    .data(data)
                    .enter().append('line')
                    .attr('x1', function (d) { return xScale(d.index, d[low])})
                    .attr('x2', function (d) {return xScale(d.index, d[high])})
                    .attr('y1', function (d) {return yScale(d.index, d[low])})
                    .attr('y2', function (d) {return yScale(d.index, d[high])})
                    .attr('class', cl);
            },
            setAxis(data,scaleConfig){
                this.createOrigin().selectAll('circle.axis-green')
                    .data([40, 60, 80, 100])
                    .enter().append('circle')
                    .attr('r',  (d)=> {return this.scaleConfig.rScale(d)})
                    .attr('class', 'axis record');
                var months = [];
                //find index for months based on data
                data.values.forEach(function (d, i) {
                    let month = d.date.split('-')[1],
                        prevDaysMonth = ( i === 0 ) ? undefined : data.values[i - 1].date.split('-')[1];
                    if (i === 0 || month != prevDaysMonth){
                        months.push({
                            month: month,
                            index: i
                        });
                    }
                });
                var axis = this.createOrigin().append('g');
                axis.selectAll('line.axis')
                    .data(months)
                    .enter().append('line')
                    .attr('x2', function (d) {
                        return scaleConfig.xScale(d.index, 120)})
                    .attr('y2', function (d) {return -scaleConfig.yScale(d.index, 120)})
                    .attr('class', 'axis');
                var circleAxis = [0, 32, 60, 80, 100]
                circleAxis = circleAxis.map( function (d) {return {temp: d, index: 320}})

                //temperature axis
                this.createOrigin().selectAll('circle.axis-white')
                    .data(circleAxis)
                    .enter().append('circle')
                    .attr('r',  (d)=> {return this.scaleConfig.rScale(d.temp)})
                    .attr('class', 'axis')

                var monthLabels = months.filter( function (d,i) {return i%3 === 0})
                //month labels
                axis.selectAll('text.months')
                    .data(monthLabels)
                    .enter().append('text')
                    .attr('x', function (d) {
                        return scaleConfig.xScale(d.index, 110)})
                    .attr('y', function (d) {return scaleConfig.yScale(d.index, 110)})
                    .text(function (d) {return d.month})
                    .attr('class', 'months');
            },
            drawBrush(){
                this.customWidgets.circularBrush
                    .range([1,366])
                    .innerRadius(10)
                    .outerRadius(218)
                    .handleSize(0.15)
                    .on("brush", this.drawSideGraph);
                this.createOrigin().attr("class", "brush").call(this.customWidgets.circularBrush);

            },
            drawSideGraph() {
                const   extent = this.customWidgets.circularBrush.extent();
                let yScale = d3.scaleLinear().domain([-10, 110]).range([100, 0]).clamp(true),
                    xScale = d3.scaleLinear().domain([1, 366]).range([0, 250]),
                    start = extent[0], end = extent[1], filteredData=[];
                if (start < end) {
                    filteredData = nyJson.values.filter(function (d) {
                        return d.index >= start && d.index <= end;
                    });
                }
                else{
                    let endData= nyJson.values.filter(function (d) {
                            return d.index >= start
                        }),
                        startData=nyJson.values.filter(function (d) {
                            return d.index <= end
                        });
                    filteredData=filteredData.concat(endData,startData);
                }
                var lineWidth = 250 / filteredData.length;
                xScale.domain([0, filteredData.length]);

                d3.select("g.linear")
                    .selectAll("g.linearBars")
                    .remove();

                d3.select("g.linear")
                    .selectAll("rect")
                    .remove();

                d3.select("g.linear")
                    .selectAll("text")
                    .remove();
                this.getSideBarOrigin()
                    .selectAll("g.linearBars")
                    .data(filteredData, function (d) {return d.date})
                    .enter()
                    .insert("g")
                    .attr("class", "linearBars")
                    .each(function (d, i) {
                        if (i === 0 || i === filteredData.length - 1) {
                            d3.select(this).append("text")
                                .text(d.date)
                                .attr("y", -30)
                                .style("text-anchor", "middle");
                        }
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "highlightline")
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "record")
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "avg")
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "yearLow")
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "yearHigh")
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "year")
                        d3.select(this).append("line").style("stroke-width", lineWidth).attr("class", "hoverline")
                    });

                d3.selectAll("g.linearBars")
                    .attr("transform", function (d,i) {return "translate(" + xScale(i) +",0)" });

                d3.selectAll("g.linearBars")
                    .each(function (d) {
                        var thisG = this;
                        d3.select(this).select("line.highlightline")
                            .attr("y1", -30)
                            .attr("y2", 100)
                            .style("stroke-width", 1)
                            .style("stroke", "black")
                            .style("opacity", 0);
                        d3.select(this).select("line.hoverline")
                            .attr("y1", -30)
                            .attr("y2", 100)
                            .style("stroke-width", lineWidth)
                            .style("opacity", 0.0)
                            .style("stroke", "black")
                            .on("mouseover", function () {
                                d3.select(thisG).select("line.highlightline").style("opacity", 1);
                            })
                            .on("mouseout", function () {
                                d3.selectAll("line.highlightline").style("opacity", 0);
                            })

                        d3.select(this).select("line.record")
                            .attr("y1", yScale(parseInt(d.recHigh)))
                            .attr("y2", yScale(parseInt(d.recLow)));
                        d3.select(this).select("line.avg")
                            .attr("y1", yScale(parseInt(d.avgHigh)))
                            .attr("y2", yScale(parseInt(d.avgLow)));
                        if (d.max != null) {
                            if (d.min < parseInt(d.avgLow)) {
                                d3.select(this).select("line.yearLow")
                                    .attr("y1", yScale(parseInt(d.min)))
                                    .attr("y2", yScale(parseInt(d.avgLow)));
                            }
                            if (d.max > parseInt(d.avgHigh)) {
                                d3.select(this).select("line.yearHigh")
                                    .attr("y1", yScale(parseInt(d.max)))
                                    .attr("y2", yScale(parseInt(d.avgHigh)));
                            }
                            if (!(d.min > parseInt(d.avgHigh) || d.max < parseInt(d.avgLow))) {
                                d3.select(this).select("line.year")
                                    .attr("y1", yScale(Math.max(d.min, parseInt(d.avgLow))))
                                    .attr("y2", yScale(Math.min(d.max, parseInt(d.avgHigh))));
                            }
                        }
                    })
            }
        },
        mounted(){
            this.initGraph()
        }
    }
</script>

<style scoped lang="scss">
    body {
        background-color: whitesmoke;
    }
    ::v-deep{
        .extent {
            fill-opacity: .1;
            fill: rgb(205,130,42);
            cursor: move;
        }
        .e {
            fill: rgb(111,111,111);
            cursor: move;
        }

        .w {
            fill: rgb(169,169,169);
            cursor: move;
        }
        svg {
            background-color: white;
            font-family: 'Lato';
        }

        .axis {
            stroke: white;
            opacity: .8;
        }

        text {
            pointer-events: none;
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
        }

        text.title {
            font-size: 26px;
        }

        text.months, text.temp {
            text-anchor: middle;
            font-size: 12px;
            fill: #39837B;
        }

        circle.axis {
            stroke: white;
            stroke-width: 1px;
            fill: none;
        }
        circle.axis.record {
            stroke: #bae0d6;
            stroke-width: 1.2px;
            opacity: 1;
        }

        line.record, line.avg, line.yearLow, line.yearHigh{
            stroke-width: 2px;
        }
        line.record {
            stroke: #bae0d6;
        }

        line.avg {
            stroke: #3FA39E;
            opacity: .5;
        }

        line.year {
            stroke: #006358;

        }

        line.yearLow, line.yearHigh{
            stroke: #F97F5A;
        }

        .avg {
            stroke: #3FA39E;
            fill: #3FA39E;
        }

        .record {
            stroke: #bae0d6;
            fill: #bae0d6;
            /*.opacity: .5;*/
        }

        .year {
            stroke: #F97F5A;
            fill: #F97F5A;
        }
        .beyond {
            stroke: #445E5B;
            fill: #445E5B;
        }
        .rain {
            fill: #209CD3;
        }
        .freeze {
            fill: #A8DFE4;
        }
        .cloudy {
            fill: #a1a1a1;
        }
        .clear {
            fill: white
        }
        .scattered {
            fill: lightgray;
        }
        .overcast {
            fill: #616161;
        }
    }




</style>