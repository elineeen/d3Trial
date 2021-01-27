<template>
    <v-row type="flex" justify="center">
        <svg class="circular-graph" :width=baseConfig.width :height=baseConfig.height></svg>
    </v-row>

</template>

<script>


    import * as d3 from "d3";
    import { observable } from '@nx-js/observer-util';
    import {annotationLabel,annotation} from "d3-svg-annotation";
    export default {
        name: "sakura",
        data(){
            return {
                control:{
                  customObservers:observable({mouseout:false}),
                },
                baseConfig:{
                    // color:d3.scaleOrdinal()
                    //     .domain(d3.range(4))
                    //     .range(["#000000", "#FFDD89", "#957244", "#F26223"]),
                    width:1200,
                    height:1200
                },
                rawData:{
                    charaDataList:[],
                    relationDataList:[],
                    chapterList:[],
                    character2ChapterRelationList:[]
                },
                graphInstance:{
                    relationChord:{
                        chordRing:null,
                        relationRibbon:null,
                        annotationGroup:null,
                    }
                }
            }
        },
        computed:{
            relationChordConfig(){
                return {
                    innerRadius:this.baseConfig.width*0.25,
                    outerRadius:this.baseConfig.width*0.25+15,
                    relationRibbonColor:this.$d3.scaleOrdinal()
                        .domain(["family", "crush", "love", "friends", "master"]) //"teacher","ex-lovers","reincarnation","rival"
                        .range(["#2C9AC6", "#FA88A8", "#E01A25", "#7EB852", "#F6B42B"])
                        .unknown("#bbbbbb")
                }
            },
            /**
             *
             * @returns {{outerRadius: number, centerRadius: number, innerRadius: number}}
             */
            chapterRingConfig(){
                let {width}=this.baseConfig;
                return {
                    innerRadius: width* 0.45,
                    outerRadius:width* 0.464,
                    centerRadius:width*0.457
                }
            }
        },
        methods:{
            createGroupOrigin(layerName){
                const {width,height}=this.baseConfig;
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(${width/2},${height/2})`);
                if(layerName)
                    origin.attr('class',layerName)
                return origin;
            },
            toggleAnnotation(flag=true,data){
                const capitalizeFirstLetter=function(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                }
                if(!this.graphInstance.relationChord.annotationGroup)
                    this.graphInstance.relationChord.annotationGroup=this.createGroupOrigin('annotation-group')
                let {annotationGroup}=this.graphInstance.relationChord,{relationRibbonColor}=this.relationChordConfig;
                if(data){
                    let annotationData = [
                        {
                            note: {
                                label: data.note,
                                title: capitalizeFirstLetter(data.type),
                                wrap: 150,
                            },
                            relation_type: "family",
                            x: +data.x ,
                            y: +data.y ,
                            dx: 5 ,
                            dy: -5
                        }
                    ];
                    //Set-up the annotation maker
                    let makeAnnotationsRelationship = annotation()
                        // .editMode(true)
                        .type(annotationLabel)
                        .annotations(annotationData);
                    annotationGroup.call(makeAnnotationsRelationship);
                    annotationGroup.selectAll(".note-line, .connector")
                        .style("stroke", "none");
                    annotationGroup.select(".annotation-note-title")
                        .style("fill", relationRibbonColor(data.type));
                }
                else {
                    if (annotationGroup)
                        annotationGroup.selectAll(".annotation").remove();
                }
            },
            dispatchMouseoverRelation(d,i){
                let {relationRibbon}=this.graphInstance.relationChord,
                    hoveredNode=relationRibbon.filter(d=>d===i);
                relationRibbon.attr("fill-opacity", 0.1)
                hoveredNode.attr("fill-opacity", 0.5)
                this.toggleAnnotation(true,i.relationData)
            },
            async initRawData(){
                let [charaDataList,relationList,chapterList,character2ChapterRelationList]=await Promise.all (
                    [
                        this.$d3.csv('./sakuraData/ccs_character_total.csv'),
                        this.$d3.csv('./sakuraData/ccs_character_relations.csv'),
                        this.$d3.json('./sakuraData/ccs_chapter_hierarchy.json'),
                        this.$d3.json('./sakuraData/ccs_character_per_chapter.json'),

                    ]);
                _.assign(this.rawData,{charaDataList,relationList,chapterList,character2ChapterRelationList});
            },
            async initRelationChord(){
                let {innerRadius,outerRadius,relationRibbonColor}=this.relationChordConfig,
                    {charaDataList,relationList}=this.rawData;
                let ringData=this.$d3.pie().value(d=>d.num_chapters).padAngle(0.05).sort(null)(charaDataList),
                    ringCentralMap=new Map();
                ringData.forEach((pieData)=>{
                    let {startAngle,endAngle}=pieData,centralDegree=(startAngle+endAngle)/2
                    pieData.centralDegree=centralDegree;
                    ringCentralMap.set(pieData.data.character,{startAngle:centralDegree-0.02,endAngle:centralDegree+0.02})
                })
                let ribbonData=relationList.map((relationData)=>{
                    let {type}=relationData
                    return {type,relationData,source:ringCentralMap.get(relationData.source),target:ringCentralMap.get(relationData.target)}
                })
                let wrapArc= this.$d3.arc()
                    //===50% border-radius
                    .cornerRadius((outerRadius-innerRadius)/2)
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);
                let innerRibbon=this.$d3.ribbon().radius(innerRadius)
                const chordRing=this.createGroupOrigin('character-ring')
                    .selectAll('g')
                    .data(ringData)
                    .join('g');
                chordRing
                    .append('path')
                    .attr('class','relation-chord')
                    .attr("fill", d => d.data.color)
                    .attr('d',wrapArc);
                chordRing
                    .append("circle")
                    .attr("class", "ring-dot")
                    .attr("cx",  (d)=> { return outerRadius*1.2 * Math.cos(d.centralDegree - Math.PI/2); })
                    .attr("cy",  (d)=> { return outerRadius*1.2 * Math.sin(d.centralDegree - Math.PI/2); })
                    .attr("r", 6 )
                    .style("fill", d=>d.data.color)
                    .style("stroke", "white")
                    .style("stroke-width", 3 );
                const relationRibbon=this.createGroupOrigin('relation-chord-ribbon')
                    .attr("fill-opacity", 0.5)
                    .selectAll('g')
                    .data(ribbonData)
                    .join('path')
                    .attr('class','relation-ribbon')
                    .attr('fill',d=>relationRibbonColor(d.type))
                    // .attr('stroke',d=>this.$d3.rgb(relationRibbonColor(d.type)).darker())
                    .attr('class','relation-ribbon')
                    .attr('d',innerRibbon)
                    .on("mouseover", this.dispatchMouseoverRelation)
                    // .on("click", this.dispatchMouseoverRelation)
                    .on("mouseout", ()=>{
                        relationRibbon.attr("fill-opacity", 0.5)
                        this.toggleAnnotation(false)
                    });
                return {relationRibbon,chordRing}
            },
            initChapterRing(){
                //章节标签数据准备
                let {chapterList}=this.rawData,
                    {width}=this.baseConfig,
                    {innerRadius,outerRadius,centerRadius}=this.chapterRingConfig;
                let chapterHierarchyDataList = chapterList.filter(function (d) {
                    return d.name === "CCS" || (d.volume_num <= 12 && !d.num) || (d.num >= 1 && d.num <= 50);
                });
                //Based on typical hierarchical clustering example
                let root = this.$d3.stratify()
                    .id(function (d) { return d.name; })
                    .parentId(function (d) { return d.parent; })
                    (chapterHierarchyDataList),

                    clusterLayoutAdapter = this.$d3.cluster()
                    .size([360, centerRadius])
                    .separation(function separation(a, b) {
                        return a.parent === b.parent ? 1 : 1.3;
                    });
                clusterLayoutAdapter(root);
                let chapterLocationData = root.leaves();
                chapterLocationData.forEach(function (d, i) {
                    d.centerAngle = d.x * Math.PI / 180;
                });
                //The distance between two chapters that belong to the same volume
                let chapterAngleDistance = chapterLocationData[1].centerAngle - chapterLocationData[0].centerAngle;
                //Add some useful metrics to the chapter data
                chapterLocationData.forEach((d)=>{
                    d.startAngle = d.centerAngle - chapterAngleDistance / 2;
                    d.endAngle = d.centerAngle + chapterAngleDistance / 2;
                })
                //画图
                //Create the donut slices per chapter
                let capsuleAdapter= this.$d3.arc()
                    .outerRadius(outerRadius)
                    .innerRadius(innerRadius)
                    .padAngle(0.01)
                    .cornerRadius(centerRadius-innerRadius)
                let chapterRingGroup = this.createGroupOrigin("chapter-ring-group")
                    .selectAll(".chapter-hover-arc")
                    .data(chapterLocationData)
                    .join('g');
                //圈
                chapterRingGroup
                    .append("path")
                    .attr("class", "arc")
                    .attr("d", capsuleAdapter)
                    .style("fill", "none")
                    .style("stroke", "#c4c4c4")
                    .style("stroke-width", 1 );
                //数字
                chapterRingGroup
                    .append("text")
                    .attr("class", "chapter-number")
                    .style("text-anchor", "middle")
                    .attr("dy", ".35em")
                    .attr("transform", (d, i)=>{
                        let angle = d.centerAngle * 180 / Math.PI - 90;
                        return "rotate(" + angle + ")translate(" + d.y + ")" +
                            // (d.centerAngle > 0 & d.centerAngle < Math.PI ? "" : "rotate(180)")
                            "rotate(" + -angle + ")";
                    })
                    .style("font-size", "9px")
                    .text((d,i)=>i+1);
            },
            generateRelationCurves(selectedCharacter){

            }
        },
        async mounted() {
            await this.initRawData();
            this.initRelationChord().then(instance=>{this.graphInstance.relationChord=instance})
            this.initChapterRing();
        }

    }
</script>

<style scoped>

</style>