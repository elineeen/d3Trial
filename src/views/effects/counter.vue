<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import dayjs from 'dayjs'
    const REFRESH_INTERVAL = 1000 / 30;
    export default {
        name: "counter",
        data(){
            return {
                baseConfig:{
                    width:1000,
                    height:600,
                    animation:{
                        maximumStickCounter:20,
                    }
                },
                countdownId:null,
                counterTransitionInstanceList:[],
                // counterArr:[],
                counterStr:'',
                numberDataPointMap:new Map([
                    [0,[
                        [35,55],
                        [65,55],
                        [80,75],
                        [80,125],
                        [65,145],
                        [35,145],
                        [20,125],
                        [20,75],
                        [35,55],
                    ]],
                    [1,[
                        [35,145],
                        [65,145],
                        [50,145],
                        [50,135],
                        [50,115],
                        [50,100],
                        [50,55],
                        [45,65],
                        [35,65],
                    ]],
                    [4,
                        [
                            [65,55],
                            [20,130],
                            [65,130],
                            [65,145],
                            [65,130],
                            [80,130],
                            [65,130],
                            [65,100],
                            [65,55]
                        ]
                    ],
                    [3,[
                        [40,55],
                        [70,55],
                        [80,70],
                        [80,100],
                        [40,100],
                        [80,100],
                        [80,130],
                        [70,145],
                        [40,145],
                    ]],
                    [2,[
                            [30,55],
                            [60,55],
                            [70,65],
                            [70,95],
                            [35,95],
                            [30,100],
                            [30,140],
                            [35,145],
                            [70,145],
                        ]
                    ],
                    [5,[
                            [70,55],
                            [40,55],
                            [30,65],
                            [30,95],
                            [65,95],
                            [70,100],
                            [70,140],
                            [65,145],
                            [30,145],
                        ]
                    ],
                    [6,[
                        [80,55],
                        [60,55],
                        [40,85],
                        [30,100],
                        [20,115],
                        [35,130],
                        [50,145],
                        [65,130],
                        [80,115],
                        [65,100],
                        [40,85],
                    ]],
                    [7, [
                        [20,55],
                        [50,55],
                        [80,55],
                        [70,85],
                        [60,115],
                        [50,145],
                    ]
                    ],
                    [8,[
                            [50,91],
                            [30,73],
                            [50,55],
                            [70,73],
                            [50,91],
                            [20,118],
                            [50,145],
                            [80,118],
                            [50,91],
                    ]],
                    [9,[
                        [20,145],
                        [40,145],
                        [60,115],
                        [70,100],
                        [80,85],
                        [65,70],
                        [50,55],
                        [35,70],
                        [20,85],
                        [35,100],
                        [60,115],
                    ]],
                ])
            }
        },
        computed:{
            counterArr(){
                return new Array(this.counterStr.length).fill(0).map((d,i)=>{
                    return this.counterStr.charAt(i);
                })
            }
        },
        methods:{
            renderCounter(){
                this.countdownId = window.setInterval( ()=> {
                    this.$forceUpdate();
                    // _this.$refs.statistic.$forceUpdate();
                    this.syncTimer();
                }, REFRESH_INTERVAL);
            },
            syncTimer(){
                this.counterStr=dayjs().format('HH:mm:ss').toString();
            },
            generateNumberPath(pointList){
                let path=this.$d3.path();
                path.moveTo(pointList[0][0],pointList[0][1])
                pointList.forEach((d,i)=>{
                    if(i<pointList.length&&i!==0)
                        path.lineTo(d[0],d[1])
                })
                return path.toString();
            },
            generateNumberLink(pointList){
                let line = [];
                pointList.forEach((d,i)=>{
                    if(i<pointList.length-1){
                        line.push(this.$d3.line()([pointList[i],pointList[i+1]]))
                    }
                })
                return line;
            },
            createGroupOrigin(layerName,transformCord=[0,0]){
                let origin=this.$d3.select("svg")
                    .append("g")
                origin.attr('transform',`translate(${transformCord[0]},${transformCord[1]})`);
                if(layerName)
                    origin.attr('class',layerName)
                return origin;
            },
            /**
             * 添加偏移，完成路径渲染
             * @param pathList
             */
            renderNumberPathList(pathList){
                this.createGroupOrigin()
                    .selectAll('g')
                    .data(pathList)
                    .join('path')
                    .attr('d',d=>d)
                    .attr('fill','none')
                    .attr('stroke','red')
                    .attr('stroke-width',3)

            },
            generateNumberTransformer(placeIndex=0){
                const linkList=new Array(10).fill(0).map((d,i)=>{
                    return this.generateNumberLink(this.numberDataPointMap.get(i));
                });
                const lineOrigin = this.createGroupOrigin('pi'+placeIndex,[placeIndex*80,0]).selectAll('g')
                    // .data(linkList[0])
                    .data(new Array(this.baseConfig.animation.maximumStickCounter).fill(0))
                    .join('path')
                    .attr('fill', "#fff")
                    .attr('stroke', '#DA3C78')
                    .attr('stroke-width',3)
                return async (index) => {
                    if(index){
                        let validIndex=index%linkList.length;
                        let newSort=linkList[validIndex].sort(()=>{return Math.random()>=0.5?1:-1});
                        await lineOrigin
                            .transition()
                            .duration(500)
                            .attr('d', (d,i)=>newSort[i]?newSort[i]:this.chooseRandomSort(newSort))
                            .end();
                    }
                };
            },
            initLinkTransition(){
                let linkList=[
                    // this.generateNumberLink(this.numberDataPointMap.get(0)),
                    // this.generateNumberLink(this.numberDataPointMap.get(1)),
                    this.generateNumberLink(this.numberDataPointMap.get(8)),
                    this.generateNumberLink(this.numberDataPointMap.get(9)),
                ];
                const lineOrigin = this.createGroupOrigin().selectAll('g')
                    // .data(linkList[0])
                    .data(new Array(this.baseConfig.animation.maximumStickCounter).fill(0))
                    .join('path')
                    .attr('fill', "#fff")
                    .attr('stroke', '#DA3C78')
                    .attr('stroke-width',3)
                    // .style("fill-opacity", (Math.random()))
                    // .attr('d', d=>d);
                const transition =async (index) => {
                    if(index){
                        let validIndex=index%linkList.length
                        const maxDuration = 2000;
                        let newSort=linkList[validIndex].sort(()=>{return Math.random()>=0.5?1:-1});
                        await lineOrigin
                            .transition()
                            .delay(2000)
                            .duration(500)
                            // .style("fill-opacity", (Math.random()))
                            .attr('d', (d,i)=>newSort[i]?newSort[i]:this.chooseRandomSort(newSort))
                            .end();
                        await transition(origin,++validIndex);
                    }

                };
                transition(lineOrigin,1)
            },
            chooseRandomSort(sortList){
                let index= Math.floor(Math.random()*sortList.length);
                return sortList[index];
            },
            initPathTransition(){
                let [path0,path1]=[
                    this.generateNumberPath(this.numberDataPointMap.get(0)),
                    this.generateNumberPath(this.numberDataPointMap.get(1)),
                ];
                let _self=this;
                const linePath = this.createGroupOrigin().append('path')
                    .attr('fill', "#fff")
                    .attr('stroke', '#DA3C78')
                    // .style("fill-opacity", (Math.random()))

                    .attr('d', path0);
                const transition = (origin) => {
                    const maxDuration = 2000;
                    origin.transition()
                        .delay(2000)
                        .duration(Math.floor(Math.random() * maxDuration))
                        .style("fill-opacity", (Math.random()))
                        .attr('d', path1)
                        .on("end", function(){
                            _self.$d3.select(this)
                                .transition()
                                .delay(2000)
                                .duration(Math.floor(Math.random() * maxDuration))
                                // .style("fill-opacity", (Math.random()))
                                .attr('d', path0)
                                .on("end", function() { transition(linePath); });
                        });
                };
                transition(linePath)
            },
            initCounterTransition(){
                this.counterTransitionInstanceList=new Array(8).fill(0).map((d,i)=>{
                    return this.generateNumberTransformer(i);
                })
            }
        },
        watch:{
            counterArr:function (newVal,oldVal) {
               newVal.forEach((d,i)=>{
                   if(d!==oldVal[i]){
                        let callee=this.counterTransitionInstanceList[i];
                        callee.call(this,d)
                   }
               })
            }
        },
        mounted() {
            //this.initLinkTransition();
            this.initCounterTransition();
            this.renderCounter();
            // this.initPathTransition()
            // let trial=this.generateNumberPath(this.numberDataPointMap.get(0));
            // this.renderNumberPathList([trial]);

        }

    }
</script>

<style scoped>

</style>