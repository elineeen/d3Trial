<template>
    <svg  :width=baseConfig.width :height=baseConfig.height></svg>
</template>

<script>
    import {geoVoronoi,geoDelaunay} from 'd3-geo-voronoi'
    export default {
        name: "voronoi",
        data(){
            return {
                baseConfig:{
                    width:1000,
                    height:1000,
                    path:null,
                },
            }
        },
        methods:{
            initGraph(){
                this.initPath();
                this.drawSphere();
                this.drawVoroni()
            },
            initPath(){
                const {width,height}=this.baseConfig;
                const projection = this.$d3.geoOrthographic()
                    .fitExtent([[1, 1], [width , height]],{type: "Sphere"})
                    .rotate([0, -50]);
                this.baseConfig.path=this.$d3.geoPath(projection);
            },
            createOrigin(){
                let origin=this.$d3.select("svg")
                    .append("g")
                    .attr('transform',`translate(0,0)`);
                return origin;
            },
            drawSphere(){
                const {path}=this.baseConfig,graticule = this.$d3.geoGraticule10();
                this.createOrigin().append("path")
                    .attr("class", "sphere")
                    .attr("d", path(graticule));
            },
            async drawVoroni(){
                const {path}=this.baseConfig;
                const points =await this.$d3.csv("https://gist.githubusercontent.com/mbostock/b5c3549cbe0a68649f87952b73d9983c/raw/631e77d2f2724d0d4b35dd9bb3a25b8c09d4a622/airports.csv",
                    ({longitude, latitude}) => [+longitude, +latitude]),
                        circle=this.$d3.geoCircle();
                let voronoiLink=geoVoronoi(points).mesh();
                this.createOrigin().append('path')
                    .attr('class','voronoi-link')
                    .attr('d',path(voronoiLink))
                this.createOrigin().selectAll('points').data(points).join('path')
                    .attr("class", "point")
                    .attr('d', (d,i)=>{
                        return path(circle.center(d).radius(0.2)())
                    })

                debugger;
            }
        },
        mounted(){
            this.initGraph()
        }
    }
</script>

<style scoped lang="scss">
    svg{
        fill:none;
        ::v-deep{
            .sphere {
                fill: none;
                stroke: lightgrey;
            }
            .point{
                stroke:red;
                fill: red;
            }
            .voronoi-link{
                stroke-width: 1px;
                stroke: lightblue;
            }
        }
    }

</style>