<template>
    <v-container>
        <v-row type="flex" justify="center">
            <v-col cols="3">
                i didn't add much info about this graph but focus on its mechanics on the relation lines,
                so u should check the <a href="https://cardcaptorsakura.visualcinnamon.com/" rel="noreferrer" >origin site </a> to see how it's works
                hover on the chapter capsule or inner ring to see different relations
            </v-col>
            <v-col cols="9">
                <svg :width=baseConfig.width :height=baseConfig.height></svg>
            </v-col>
        </v-row>
    </v-container>


</template>

<script>
    import {observable} from '@nx-js/observer-util';
    import {annotation, annotationLabel} from "d3-svg-annotation";

    export default {
        name: "sakura",
        data(){
            return {
                control:{
                    customObservers:observable({mouseout:false}),
                },
                baseConfig:{
                    width:900,
                    height:900
                },
                rawData:{
                    charaDataList:[],
                    relationDataList:[],
                    chapterList:[],
                    character2ChapterRelationList:[],
                    coverRelationList:[]
                },
                graphInstance:{
                    relationChord:{
                        chordRing:null,
                        relationRibbon:null,
                        annotationGroup:null,
                    },
                    outerRelationRing:{
                        chapterRingGroup:null,
                        capsuleRing:null,
                        ringCapsuleNum:null,
                        outerRelationGroup:null,
                        relationDataList:null,
                    },
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
            dispatchMouseoverInnerRelation(d,i){
                let {relationRibbon}=this.graphInstance.relationChord,
                    hoveredNode=relationRibbon.filter(d=>d===i);
                relationRibbon.attr("fill-opacity", 0.1)
                hoveredNode.attr("fill-opacity", 0.5)
                this.toggleAnnotation(true,i.relationData)
            },
            async initRawData(){
                let [charaDataList,relationList,chapterList,character2ChapterRelationList,coverRelationList]=await Promise.all (
                    [
                        this.$d3.csv('./sakuraData/ccs_character_total.csv'),
                        this.$d3.csv('./sakuraData/ccs_character_relations.csv'),
                        this.$d3.json('./sakuraData/ccs_chapter_hierarchy.json'),
                        this.$d3.json('./sakuraData/ccs_character_per_chapter.json'),
                        this.$d3.json('./sakuraData/ccs_character_per_chapter_cover.json'),

                    ]);
                _.assign(this.rawData,{charaDataList,relationList,chapterList,character2ChapterRelationList,coverRelationList});
            },
            initRelationChord(){
                let {innerRadius,outerRadius,relationRibbonColor}=this.relationChordConfig,
                    {charaDataList,relationList}=this.rawData;
                let ringData=this.$d3.pie().value(d=>d.num_chapters).padAngle(0.05).sort(null)(charaDataList),
                    ringCentralMap=new Map();
                ringData.forEach((pieData)=>{
                    let {startAngle,endAngle}=pieData,centerAngle=(startAngle+endAngle)/2
                    pieData.centerAngle=centerAngle;
                    ringCentralMap.set(pieData.data.character,{startAngle:centerAngle-0.02,endAngle:centerAngle+0.02})
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
                    .join('g')
                    .on("mouseover", this.dispatchCharacter2ChapterLines)
                    .on("mouseout", this.clearOuterRelations);
                chordRing
                    .append('path')
                    .attr('class','relation-chord')
                    .attr("fill", d => d.data.color)
                    .attr('d',wrapArc);
                const chordRingDot=chordRing
                    .append("circle")
                    .attr("class", "ring-dot")
                    .attr("cx",  (d)=> { return outerRadius*1.2 * Math.cos(d.centerAngle - Math.PI/2); })
                    .attr("cy",  (d)=> { return outerRadius*1.2 * Math.sin(d.centerAngle - Math.PI/2); })
                    .attr("r", 6 )
                    .style("fill", d=>d.data.color)
                    .style("stroke", "white")
                    .style("stroke-width", 3 )

                const relationRibbon=this.createGroupOrigin('relation-chord-ribbon')
                    .attr("fill-opacity", 0.5)
                    .selectAll('g')
                    .data(ribbonData)
                    .join('path')
                    .attr('class','relation-ribbon')
                    .attr('fill',d=>relationRibbonColor(d.type))
                    .attr('class','relation-ribbon')
                    .attr('d',innerRibbon)
                    .on("mouseover", this.dispatchMouseoverInnerRelation)
                    .on("mouseout", ()=>{
                        relationRibbon.attr("fill-opacity", 0.5)
                        this.toggleAnnotation(false)
                    });
                return {relationRibbon,chordRing,chordRingDot}

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
                    .join('g')
                    .on('mouseover',this.dispatchChapter2CharacterLines)
                    .on("mouseout", this.clearOuterRelations);
                //圈
                const capsuleRing=chapterRingGroup
                    .append("path")
                    .attr("class", "chapter-capsule")
                    .attr("d", capsuleAdapter)
                    .style("fill", "white")
                    .style("stroke", "#c4c4c4")
                    .style("stroke-width", 1 );
                //数字
                const ringCapsuleNum=chapterRingGroup
                    .append("text")
                    .attr("class", "chapter-number")
                    .attr("cursor", "default")
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
                //接点
                const ringCapsuleDot=chapterRingGroup
                    .append("circle")
                    .attr("class", "chapter-dot")
                    .attr("cx", function (d) { return innerRadius * Math.cos(d.centerAngle - Math.PI/2); })
                    .attr("cy", function (d) { return innerRadius * Math.sin(d.centerAngle - Math.PI/2); })
                    .attr("r", 2)
                    .style("fill", "#c4c4c4")
                    .style("stroke", "white")
                    .style("stroke-width", 2 * 0.5);
                return {capsuleRing,ringCapsuleNum,chapterRingGroup}
            },
            clearOuterRelations(enableCover=true){
                let {outerRelationGroup,relationDataList}=this.graphInstance.outerRelationRing;
                if(outerRelationGroup){
                  this.$d3.select('svg').selectAll('.outer-relaton-path-group').remove();
                }
                if(relationDataList)
                    this.invertCapsuleStyles(relationDataList,false);
                if(enableCover){
                    //重绘cover
                    this.dispatchGenerateCoverRelation();
                    this.$d3.select('svg').selectAll('.outer-relaton-path-group')
                        .attr("opacity", 0.5)
                }
            },
            dispatchChapter2CharacterLines(d,i){
                this.clearOuterRelations(false);
                let circleElementInstance=d.currentTarget.lastChild
                let {character2ChapterRelationList}=this.rawData, {chordRing}=this.graphInstance.relationChord;
                let filteredRelationList=character2ChapterRelationList.filter((d)=>{
                    return d.chapter===i.data.num
                })
                let relationDataList=filteredRelationList.map((d)=>{
                    let match=chordRing.filter((characterData)=>characterData.data.character===d.character)
                    return {target:match.datum(),source:i}
                })
                this.graphInstance.outerRelationRing.relationDataList=relationDataList;
                this.graphInstance.outerRelationRing.outerRelationGroup=this.generateChapter2CharaCurves(relationDataList,circleElementInstance.attributes)

                // let {chapterRingGroup} = this.graphInstance.outerRelationRing
                // debugger;
                // const selectedG=chapterRingGroup.filter(node=>node===i)
                // selectedG
                //     .selectAll('.chapter-capsule')
                //     .style('fill',d=>doInvert?(relationWeakMap.get(d)?.data?.color):'white')
                // selectedG
                //     .selectAll('.chapter-number')
                //     .style('color',doInvert?'white':'black')
            },
            dispatchCharacter2ChapterLines(d,i){
                this.clearOuterRelations(false);
                let circleElementInstance=d.currentTarget.lastChild
                let {character2ChapterRelationList}=this.rawData,
                    {capsuleRing}=this.graphInstance.outerRelationRing;
                let filteredRelationList=character2ChapterRelationList.filter((d)=>{
                    return d.character===i.data.character
                })
                let relationDataList=filteredRelationList.map((d)=>{
                    let match=capsuleRing.filter((capsuleData)=>capsuleData.data.num===d.chapter)
                    return {target:match.datum(),source:i}
                })
                //key
                this.graphInstance.outerRelationRing.relationDataList=relationDataList;
                this.graphInstance.outerRelationRing.outerRelationGroup=this.generateChara2ChapterCurves(relationDataList,circleElementInstance.attributes)
                this.invertCapsuleStyles(relationDataList);
            },
            dispatchGenerateCoverRelation(){
                const {coverRelationList}=this.rawData,
                    {capsuleRing}=this.graphInstance.outerRelationRing,
                    {chordRing}=this.graphInstance.relationChord;
                let relationDataList=coverRelationList.map((d)=>{
                    let target=capsuleRing.filter((capsuleData)=>capsuleData.data.num===d.chapter)?.datum();
                    let sourceSelection=chordRing.filter(chordData=>chordData.data.character===d.character);
                    let source=sourceSelection.datum()
                   return{
                       target,
                       source,
                       sourceSelection
                   }
                })
                //不该用cx cy来做偏移的，如果以后要重构希望可以直接用角度算偏移
                let startPointAttrList=relationDataList.map(d=> d.sourceSelection?._groups[0][0]?.lastChild?.attributes);
                this.graphInstance.outerRelationRing.outerRelationGroup=this.generateChara2ChapterCurves(relationDataList,startPointAttrList)
                // this.invertCapsuleStyles(relationDataList);
            },
            /**
             * 触发内圈关联响应时返显capsule样式,doinvert:返显/复原
             */
            invertCapsuleStyles(relationDataList,doInvert=true,isChapter2Chara=false){
                let {chapterRingGroup}=this.graphInstance.outerRelationRing;
                let relationWeakMap=new WeakMap();
                relationDataList.forEach((d)=>{
                    if(isChapter2Chara)
                        relationWeakMap.set(d.source,d.target);
                    else
                        relationWeakMap.set(d.target,d.source);
                })
                let groupDataMatch=chapterRingGroup.filter((d)=>{
                    return relationWeakMap.get(d)!==undefined
                });
                groupDataMatch
                    .selectAll('.chapter-capsule')
                    .style('fill',d=>doInvert?(relationWeakMap.get(d)?.data?.color):'white')
                groupDataMatch
                    .selectAll('.chapter-number')
                    .style('color',doInvert?'white':'black')
                return groupDataMatch
            },

            generateChapter2CharaCurves(relationDataList,startPointAttr){
                let innerRingRadius=this.relationChordConfig.outerRadius*1.2;
                let outerRingRaidius=this.chapterRingConfig.innerRadius;
                let {width,height}=this.baseConfig;
                //该折线分为三段，一段从点到拐点，二段为从拐点到目标角度（目测为目标startend）附近的一段arc，最后为一段为弧度终点到capsule中间位置的一段直线
                let offsetDistance=outerRingRaidius-innerRingRadius;
                //峰式scale
                let firstLineRadiusScale=this.$d3.scaleLinear(
                    [-Math.PI,0,Math.PI],
                    [outerRingRaidius-offsetDistance*0.1,outerRingRaidius-offsetDistance*0.9,outerRingRaidius-offsetDistance*0.1]
                );
                let firstLineAngleScale=this.$d3.scaleLinear([-Math.PI,Math.PI],[Math.PI/8,-Math.PI/8]);
                //计算从source-拐点-arc-capsule内侧的路径中的关键点数据列表
                let customCurveDataList=relationDataList.map((relationObj)=>{
                    let {source,target}=relationObj
                    let offsetAngle=(source.centerAngle-target.centerAngle);
                    //offset是个-2pi-2pi之间的值，-pi到pi之间可以保留，超出的值要进行处理
                    // 超过180度的应转成负值
                    if(offsetAngle>Math.PI)
                        offsetAngle=offsetAngle-Math.PI*2;
                    if(offsetAngle<-Math.PI)
                        offsetAngle=Math.PI*2+offsetAngle;
                    let inflectionArcStartPointAngle=source.centerAngle+firstLineAngleScale(offsetAngle);
                    let inflectionPointRadius=firstLineRadiusScale(offsetAngle)
                    //curveAngle为加上偏移值的最终值，范围应在0-2pi，如果超过则进行处理
                    if(inflectionArcStartPointAngle>Math.PI*2)
                        inflectionArcStartPointAngle=inflectionArcStartPointAngle-Math.PI*2;
                    if(inflectionArcStartPointAngle<0)
                        inflectionArcStartPointAngle=inflectionArcStartPointAngle+Math.PI*2;
                    const position=this.getAnglePosition(offsetAngle);
                    //相对位置在左侧则贴近endAngle，在右侧则贴近startAngle
                    let inflectionArcEndPointAngle=position==='left'?target.endAngle:target.startAngle
                    //及其极端的情况，起始角度在capsule位置内，则指向中心
                    if(this.isInCapsuleAngleRange(target.startAngle,target.endAngle,inflectionArcStartPointAngle)){
                        inflectionArcEndPointAngle=target.centerAngle;
                    }
                    const inflectionArc2TargetAdapter=this.$d3.lineRadial().curve(this.$d3.curveBasis)
                    ([
                        [inflectionArcEndPointAngle,inflectionPointRadius],
                        [target.centerAngle,inflectionPointRadius],
                        [target.centerAngle,innerRingRadius]
                    ]);
                    return {
                        ...relationObj,
                        inflectionPointRadius,//arc弧度
                        inflectionArcStartPointAngle,//arc拐点起点角度
                        inflectionArcEndPointAngle,//arc拐点终点角度
                        inflectionArc2TargetAdapter,//arc拐点终点到capsule的line adapter
                        position //target相对于source 偏移方向
                    };
                })
                //根据关键点数据拼装路径
                let pathAdapter=customCurveDataList.map((d)=>{
                    let path= this.$d3.path()
                    //d3的角度计算和canvas角度计算差90度,且角度相反.......
                    path.moveTo(parseFloat(startPointAttr.cx.nodeValue)+width/2,parseFloat(startPointAttr.cy.nodeValue)+height/2);
                    path.arc(width/2,height/2,d.inflectionPointRadius,d.inflectionArcStartPointAngle-Math.PI/2, d.inflectionArcEndPointAngle-Math.PI/2,
                        d.position === 'left');
                    return [path.toString(),d.inflectionArc2TargetAdapter,d.target.data.color]
                })
                const outerRelationGroup=this.createGroupOrigin('outer-relaton-path-group',false)
                    .selectAll('outer-relaton-path')
                    .data(pathAdapter)
                    .join('g')
                outerRelationGroup
                    .append('path')
                    .attr("stroke-opacity", 0.5)
                    .style("stroke", d=>d[2])
                    .style("stroke-width", 3)
                    // .style("stroke", (d,i)=>{ return i>8&&i<10?'black':'white'})
                    .style("fill", "none")
                    .attr('d',d=>d[0])
                outerRelationGroup
                    .append('path')
                    .style("fill", "none")
                    .attr("stroke-opacity", 0.5)
                    .attr('transform',`translate(${width/2},${height/2})`)
                    .style("stroke", d=>d[2])
                    .style("stroke-width", 3)
                    .attr('d',d=>d[1]);
                return outerRelationGroup;
            },
            generateChara2ChapterCurves(relationDataList,startPointData){
                let innerRingRadius=this.relationChordConfig.outerRadius*1.2;
                let outerRingRaidius=this.chapterRingConfig.innerRadius;
                let {width,height}=this.baseConfig;
                //该折线分为三段，一段从点到拐点，二段为从拐点到目标角度（目测为目标startend）附近的一段arc，最后为一段为弧度终点到capsule中间位置的一段直线
                let offsetDistance=outerRingRaidius-innerRingRadius;
                //峰式scale
                let firstLineRadiusScale=this.$d3.scaleLinear(
                    [-Math.PI,0,Math.PI],
                    [offsetDistance*0.1+innerRingRadius,offsetDistance*0.9+innerRingRadius,offsetDistance*0.1+innerRingRadius]
                );
                let firstLineAngleScale=this.$d3.scaleLinear([-Math.PI,Math.PI],[Math.PI/8,-Math.PI/8]);
                //计算从source-拐点-arc-capsule内侧的路径中的关键点数据列表
                let customCurveDataList=relationDataList.map((relationObj)=>{
                    let {source,target}=relationObj
                    let offsetAngle=(source.centerAngle-target.centerAngle);
                    //offset是个-2pi-2pi之间的值，-pi到pi之间可以保留，超出的值要进行处理
                    // 超过180度的应转成负值
                    if(offsetAngle>Math.PI)
                        offsetAngle=offsetAngle-Math.PI*2;
                    if(offsetAngle<-Math.PI)
                        offsetAngle=Math.PI*2+offsetAngle;
                    let inflectionArcStartPointAngle=source.centerAngle+firstLineAngleScale(offsetAngle);
                    let inflectionPointRadius=firstLineRadiusScale(offsetAngle)
                    //curveAngle为加上偏移值的最终值，范围应在0-2pi，如果超过则进行处理
                    if(inflectionArcStartPointAngle>Math.PI*2)
                        inflectionArcStartPointAngle=inflectionArcStartPointAngle-Math.PI*2;
                    if(inflectionArcStartPointAngle<0)
                        inflectionArcStartPointAngle=inflectionArcStartPointAngle+Math.PI*2;
                    const position=this.getAnglePosition(offsetAngle);
                    //相对位置在左侧则贴近endAngle，在右侧则贴近startAngle
                    let inflectionArcEndPointAngle=position==='left'?target.endAngle:target.startAngle
                    //及其极端的情况，起始角度在capsule位置内，则指向中心
                    if(this.isInCapsuleAngleRange(target.startAngle,target.endAngle,inflectionArcStartPointAngle)){
                        inflectionArcEndPointAngle=target.centerAngle;
                    }
                    //最后一段从弧度拐点到目标capsule的弧线
                    const inflectionArc2TargetAdapter=this.$d3.lineRadial().curve(this.$d3.curveBasis)
                    ([
                        [inflectionArcEndPointAngle,inflectionPointRadius],
                        [target.centerAngle,inflectionPointRadius],
                        [target.centerAngle,(outerRingRaidius-inflectionPointRadius)*0.8+inflectionPointRadius],
                        [target.centerAngle,outerRingRaidius]
                    ])
                    return {
                        ...relationObj,
                        inflectionPointRadius,//arc弧度
                        inflectionArcStartPointAngle,//arc拐点起点角度
                        inflectionArcEndPointAngle,//arc拐点终点角度
                        inflectionArc2TargetAdapter,//arc拐点终点到capsule的line adapter
                        position //target相对于source 偏移方向
                    };
                })
                //根据关键点数据拼装路径
                let pathAdapter=customCurveDataList.map((d,i)=>{
                    let path= this.$d3.path()
                    let startPointAttr=Array.isArray(startPointData)?startPointData[i]:startPointData
                    //d3的角度计算和canvas角度计算差90度,且角度相反.......
                    path.moveTo(parseFloat(startPointAttr.cx.nodeValue)+width/2,parseFloat(startPointAttr.cy.nodeValue)+height/2);
                    path.arc(width/2,height/2,d.inflectionPointRadius,d.inflectionArcStartPointAngle-Math.PI/2, d.inflectionArcEndPointAngle-Math.PI/2,
                        d.position === 'left');
                    return [path.toString(),d.inflectionArc2TargetAdapter,d.source.data.color]
                })
                const outerRelationGroup=this.createGroupOrigin('outer-relaton-path-group',false)
                    .selectAll('outer-relaton-path')
                    .data(pathAdapter)
                    .join('g')
                outerRelationGroup
                    .append('path')
                    .attr("stroke-opacity", 0.5)
                    .style("stroke", d=>d[2])
                    .style("stroke-width", 3)
                    // .style("stroke", (d,i)=>{ return i>8&&i<10?'black':'white'})
                    .style("fill", "none")
                    .attr('d',d=>d[0])
                outerRelationGroup
                    .append('path')
                    .style("fill", "none")
                    .attr("stroke-opacity", 0.5)
                    .attr('transform',`translate(${width/2},${height/2})`)
                    .style("stroke", d=>d[2])
                    .style("stroke-width", 3)
                    // .style("stroke", (d,i)=>{ return i<3?'black':'white'})
                    .attr('d',d=>d[1]);
                return outerRelationGroup;
            },
            /**
             *根据偏移角度计算是在左侧还是右侧
             * @param offsetAngle
             * @returns {string}
             */
            getAnglePosition(offsetAngle){
                let position='';
                if(offsetAngle>0&&offsetAngle<Math.PI)
                    position='left';
                else if(offsetAngle< -Math.PI)
                    position='left';
                else if(offsetAngle>Math.PI)
                    position='right'
                else if(offsetAngle<0&&offsetAngle>-Math.PI)
                    position="right"
                return position
            },
            /**
             * 某些极端情况，需要改变position值，判断是否该点角度是否位于capsule angle范围内
             */
            isInCapsuleAngleRange(startAngle,endAngle,centerAngle){
                if(endAngle<startAngle)
                    return  centerAngle<startAngle||centerAngle>endAngle
                else
                    return centerAngle>=startAngle&&centerAngle<=endAngle
            }
        },
        async mounted() {
            await this.initRawData();
            this.graphInstance.relationChord=this.initRelationChord()
            this.graphInstance.outerRelationRing=this.initChapterRing()
            this.dispatchGenerateCoverRelation();
        }

    }
</script>

<style scoped>

</style>