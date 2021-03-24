<template>
    <v-container>
        <v-row>
            <v-col>
                <v-text-field
                        v-model="userInputInteractListStr"
                        :error="interactListInValid"
                        label="input a sequence to generate a sequence swoosh animation">
                </v-text-field>
                <v-input :value="userInputInteractListStr"></v-input></v-col>
            <v-col><v-btn :color="interactListInValid?'error':'normal'"
                          :disabled="interactListInValid"
                          @click="dispatchResetAnimator">{{interactListInValid?'invalid input':'reset@play'}}</v-btn></v-col>
        </v-row>
        <svg  :width=baseConfig.width :height=baseConfig.height+200></svg>
    </v-container>

</template>

<script>
    import angleMixin from "../../components/mixin/angleMixin";

    export default {
        name: "circularEffects",
        mixins:[angleMixin],
        data(){
          return {
              baseConfig:{
                  ringCounter:24,
                  width:1000,
                  height:600,
                  margin:{
                      top: 10,
                      right: 10,
                      bottom: 20,
                      left: 40
                  }
              },
              animateConfig:{
                dynamicLineDuration:1500,
              },
              userInputInteractListStr:[3,1,4,10,7,1].toString(),
              instances:{
                  circle:null,
                  animatorTimer:null,
              }
          }
        },
        computed:{
            interactList(){
                return this.userInputInteractListStr.split(',').map(d=>parseInt(d));
            },
            interactListInValid(){
                let invalidMatch=this.interactList.filter(d=>d===NaN||d>24)
                return invalidMatch.length>0?true:false
            }
        },
        methods:{
            dispatchResetAnimator(){
                if(!this.interactListInValid)
                    this.setSwooshAnimator(this.interactList)
            },
            /**
             * 给两点坐标及半径，求圆心坐标，我怎么没想到这里还要做数学题.jpg
             */
            computeCustomCircleCenter(p1,p2,r){
                let [x1,y1]=p1,[x2,y2]=p2;
                const c1=(x2*x2 - x1*x1 + y2*y2 - y1*y1) / (2 *(x2 - x1));
                const c2 = (y2 - y1) / (x2 - x1);
                const A=(c2*c2 + 1);
                const B=(2 * x1*c2 - 2 * c1*c2 - 2 * y1);
                const C=x1*x1 - 2 * x1*c1 + c1*c1 + y1*y1 - r*r;
                let resultY0=(-B + Math.sqrt(B*B - 4 * A*C)) / (2 * A),resultY1=(-B - Math.sqrt(B*B - 4 * A*C)) / (2 * A);
                return [[c1 - c2 * resultY0,resultY0],[c1 - c2 * resultY1,resultY1]]
            },
            computeLength(p1,p2){
                let [x1,y1]=p1,[x2,y2]=p2;
                return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))
            },
            computeRelativeAngle(center,circlePoint,r){
              let [x0,y0]=center,[x1,y1]=circlePoint;
              const offsetX=x1-x0,offsetY=y0-y1;
              return Math.atan2(offsetX,offsetY)
            },
            /**
             * 计算arc绘制clockwise方向，选择弧度较长的一侧的方向
             * @param a1 起始角度
             * @param a2 终止角度
             * @returns {boolean}
             */
            computeClockWise(a1,a2){
                //转换成正确角度
                if(a1<0)
                    a1+=(Math.PI*2)
                if(a2<0)
                    a2+=(Math.PI*2)
                let offset=a2-a1;
                return this.getAnglePosition(offset)==='left'?true:false
            },
            createGroupOrigin(layerName,needTransform=true){
                const {width,height}=this.baseConfig;
                let origin=this.$d3.select("svg")
                    .append("g")
                if(needTransform)
                    origin.attr('transform',`translate(${width/2},${height/2})`);
                if(layerName)
                    origin.attr('class',layerName)
                return origin;
            },
            initInnerCircle(){
                const {width,ringCounter}=this.baseConfig;
                let outerRadius=width/8,innerRadius=outerRadius-10
                const pieDataList=new Array(ringCounter).fill(0).map((d,i)=>{
                    return {number:i+1}
                });
                const pieData=this.$d3.pie().value(d=>1)(pieDataList).map(d=>{
                    return {...d,centerAngle:(d.startAngle+d.endAngle)/2}});
                let pieArc= this.$d3.arc()
                    //===50% border-radius
                    .cornerRadius((outerRadius-innerRadius)/2)
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
                const circleGroup=this.createGroupOrigin().selectAll('g')
                    .data(pieData)
                    .join('g')
                circleGroup.append('path')
                    .attr('d',pieArc)
                    .attr('stroke','#000000')
                    .attr('fill','none')
                circleGroup.append('text')
                    .attr("class", "chapter-number")
                    .attr("cursor", "default")
                    .style("text-anchor", "middle")
                    .attr("dy", ".35em")
                    .attr("transform", (d, i)=>{
                        let angle = d.centerAngle * 180 / Math.PI - 90;
                        return "rotate(" + angle + ")translate(" + (outerRadius+innerRadius)/2 + ")" +
                            "rotate(" + -angle + ")";
                    })
                    .style("font-size", "9px")
                    .text(d => d.data.number);
                circleGroup.append("circle")
                    .attr("class", "circle-dot")
                    .attr("cx", function (d) { return (outerRadius+2) * Math.cos(d.centerAngle - Math.PI/2); })
                    .attr("cy", function (d) { return (outerRadius+2) * Math.sin(d.centerAngle - Math.PI/2); })
                    .attr("r", 2)
                    .style("fill", "#c4c4c4")
                    .style("stroke", "white")
                    .style("stroke-width", 2 * 0.5);
                return circleGroup;
            },
            setSwooshAnimator(moveList){
                let circleInstance=this.instances.circle;
                const swooshDataList=moveList.map((d,i)=>{
                    let numPair=i===moveList.length-1?[moveList[i],moveList[0]]:[moveList[i],moveList[i+1]]
                    /**
                     * 获取2个对应区块相应中心点坐标
                     **/
                    let coordinatePair=numPair.map((d)=>{
                        let instanceMatch=circleInstance.filter((circleData)=>{
                            return circleData.data.number===d
                        })
                        let instanceCircleAttr=instanceMatch.select('circle')?.nodes()[0].attributes
                        return [parseFloat(instanceCircleAttr.cx.nodeValue),
                                parseFloat(instanceCircleAttr.cy.nodeValue)]
                    })
                    /**
                     *获取拓展半径
                     **/
                    let ringRadius=this.computeLength(coordinatePair[0],coordinatePair[1])*0.8;
                    /**
                     * 计算两个相对圆心
                     */
                    let animateRingCenter=this.computeCustomCircleCenter(coordinatePair[0],coordinatePair[1],ringRadius);
                    let [ringCenterDistance1,ringCenterDistance2]=
                        [
                            this.computeLength(animateRingCenter[0],[0,0]),
                            this.computeLength(animateRingCenter[1],[0,0])
                        ]
                    /**
                     * 计算真实圆心
                     */
                    const ringCenterPoint=ringCenterDistance1>ringCenterDistance2?animateRingCenter[0]:animateRingCenter[1]
                    return {
                        //计算圆心相对两个圆上点的相对角度,并旋转一定角度转换成canvas arc坐标系
                            startAngle:this.computeRelativeAngle(ringCenterPoint,coordinatePair[0],ringRadius)-Math.PI/2,
                            endAngle:this.computeRelativeAngle(ringCenterPoint,coordinatePair[1],ringRadius)-Math.PI/2,
                            radius:ringRadius,
                            ringCenterPoint,
                            coordinatePair
                    }
                });
                const swooshAdapter=swooshDataList.map(d=>{
                    let path= this.$d3.path()
                    path.arc(
                        d.ringCenterPoint[0],
                        d.ringCenterPoint[1],
                        d.radius,
                        d.startAngle,
                        d.endAngle,
                        this.computeClockWise(d.startAngle,d.endAngle)
                    );
                    return path.toString();
                })
                //清空上次实例及timer
                if(this.instances.animatorTimer){
                    this.instances.animatorTimer.stop()
                    this.$d3.selectAll(".swoosh-path").remove();
                }
                this.createGroupOrigin('swoosh-path')
                    .selectAll('g')
                    .data(swooshAdapter)
                    .join('path')
                    .style("stroke", 'red')
                    .style('fill','none')
                    .attr('d',d=>d)
                let counter=0;
                let {dynamicLineDuration}=this.animateConfig;
                let transitionFactory=()=>{ return this.$d3.transition().duration(dynamicLineDuration)};
                this.$d3.selectAll(".swoosh-path").selectChildren('path')
                    .style("opacity", 0);
                let animatorTimer=this.instances.animatorTimer=this.$d3.interval(()=>{
                    let pathLetter = this.$d3.select( this.$d3.selectAll(".swoosh-path").selectChildren('path')._groups[0][counter] );
                    let totalLength = pathLetter.node().getTotalLength();
                    pathLetter
                        .style("opacity", 0.7)
                        .attr("stroke-dasharray", totalLength + " " + totalLength)
                        .attr("stroke-dashoffset", totalLength)
                        .transition(transitionFactory)
                        .attr("stroke-dashoffset", 0);
                    counter++;
                    if(counter>=swooshDataList.length)
                        animatorTimer.stop()
                },1000)
            }
        },
        mounted() {
            this.instances.circle=this.initInnerCircle()
            this.setSwooshAnimator(this.interactList)
        }
    }
</script>

<style scoped>

</style>