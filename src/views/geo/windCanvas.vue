<template>
    <div>
        <canvas id="display" :width=baseConfig.width :height=baseConfig.height>></canvas>
    </div>
</template>

<script>
    import Wind from "./wind";
    import {Vector} from "./vectorField";
    export default {
        name: "windCanvas",
        mixins: [Wind],
        data(){
            return {
                baseConfig: {
                    totalParticles: 5000,
                }
            }
        },
        methods:{
            createOrigin(){
                // let origin=this.$d3.select("svg")
                //     .append("g")
                //     .attr('transform',`translate(0,0)`);
                // return origin;
            },
            getCanvas(){
                return  document.getElementById('display').getContext('2d');
            },
            drawArea(){
                let instance=this.getCanvas(),{width,height}=this.baseConfig;
                //想出这个的人真是神来之笔，由于每次迭代刷新背景，这里的透明度
                // opacity覆盖之前的color需要3次迭代大概才会消失，为line增添连续感和扭曲感，关！键！是！这个在svg上做不到啊哈哈哈哈哈
                instance.fillStyle =  'rgb(40,40,40,0.2)';
                instance.fillRect(0,0,width,height)
            },
            initSimulation(){
                let {projection,colorPalette}=this.baseConfig;
                for (let i = 0; i < this.baseConfig.totalParticles; i++) {
                    this.remote.particles.push(this.makeParticle(null));
                }
                const simulation = this.$d3.forceSimulation(this.remote.particles)
                    .alphaTarget(0.9)
                    // .velocityDecay(0)
                    .on("tick", ()=>{
                        simulation.stop();
                    });
                const instance=this.getCanvas();
                this.$d3.interval(()=>{
                    this.drawArea();
                    //重新计算每个点是否在边界与生命周期内，否则重新生成新粒子
                    for (let i = 0; i < this.remote.particles.length; i++) {
                        let p = this.remote.particles[i];
                        if (p.age > 0 && this.remote.dataField.inBounds(p.x, p.y)) {
                            p.age--;
                            p.v=this.remote.dataField.getValue(p.x,p.y)
                        } else {
                            this.remote.particles[i] = this.makeParticle(null);
                        }
                    }
                    instance.lineWidth = .75;
                    for (let i = 0; i<this.remote.particles.length;i++) {
                        let p = this.remote.particles[i];
                        if (!this.remote.dataField.inBounds(p.x, p.y)) {
                            p.age = -2;
                            continue;
                        }
                        if (p&&(p.oldX != -1)) {
                            let colorScale = p.v.length() / this.remote.dataField.maxLength,
                                windColorDepth = 90 + Math.round(350 * colorScale); // was 400
                            if (windColorDepth > 255) {
                                windColorDepth = 255;
                            }
                            instance.strokeStyle = colorPalette[windColorDepth];
                            let projectedCoordinate=projection([p.x,p.y]),oldProjectedCoordinate=projection([p.oldX,p.oldY]);
                            if(projectedCoordinate){
                                instance.beginPath();
                                instance.moveTo(projectedCoordinate[0], projectedCoordinate[1]);
                                instance.lineTo(oldProjectedCoordinate[0], oldProjectedCoordinate[1]);
                                instance.stroke();
                            }
                        }
                    }
                    // links
                    //     .data(this.remote.particles)
                    //     .attr('transform',(d,i)=>{
                    //         let projectedCoordinate=projection([d.x,d.y]);
                    //         return `translate(${projectedCoordinate?projectedCoordinate.join():'0,0'})`})
                    //     .attr("x1", d => d.x)
                    //     .attr("y1", d => d.y)
                    //     .attr("x2", d => d.oldX===-1?d.x:d.oldX)
                    //     .attr("y2", d => d.oldY===-1?d.y:d.oldY)
                    //     .attr("stroke", d=>{
                    //         let wind = d.v;
                    //         if(wind){
                    //             var s = wind.length() / this.remote.dataField.maxLength;
                    //             let c = 90 + Math.round(350 * s); // was 400
                    //             if (c > 255) {
                    //                 c = 255;
                    //             }
                    //             return this.baseConfig.colorPalette[c];
                    //         }
                    //         else
                    //             return '#050'
                    //
                    //     })
                    simulation
                        .nodes(this.remote.particles)
                        .force("x", this.$d3.forceX().strength((d,i)=>{
                            d.oldX=d.x;
                            return 0.001*d.v.x
                        }))
                        .force("y", this.$d3.forceY().strength((d,i)=>{
                            d.oldY=d.y;
                            return 0.001*d.v.y
                        }))
                    simulation.restart();
                },40);
            },
        },
        mounted() {

        }
    }
</script>

<style scoped>

</style>