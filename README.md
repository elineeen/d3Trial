# d3trial
```
 gathered samples from web and rewrite them in d3v6
 listed work is ordered by createTime ascending
```
## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```
## try demos online(为节省体积，没有引入babel完整polyfill，不兼容不支持es5及以下的浏览器)

### [chord official example](https://elineeen.github.io/d3Trial/#/chord1)
origin:https://observablehq.com/@d3/chord-diagram

### [chord dependency example](https://elineeen.github.io/d3Trial/#/chord2)
origin:https://observablehq.com/@d3/chord-dependency-diagram?collection=@d3/d3-chord
```
learn how to use arc,path and chord/ribbons
```
### [polar custom brush](https://elineeen.github.io/d3Trial/#/customBrush)
origin:https://bl.ocks.org/emeeks/2fffa9abe50ac97603c7
```
scales,customWidgets,polar,etc
```
### [common bars](https://elineeen.github.io/d3Trial/#/barchart)
```
axis&stack
```

### [hierarchyCircleLayout](https://elineeen.github.io/d3Trial/#/layout1)
origin:https://observablehq.com/@d3/hierarchical-edge-bundling
```
layouts(tree/cluster/hierarchy),curves
```
### [forceTreeLayout](https://elineeen.github.io/d3Trial/#/layout2)
```
layouts(tree/force)
```
### [geoVoronoi](https://elineeen.github.io/d3Trial/#/geoVoronoi)
```
rotatable geoVoronoi Map in svg, using geoPath,projections&voronoi
```

### [particleCollision](https://elineeen.github.io/d3Trial/#/collision)
origin:https://observablehq.com/@d3/collision-detection/2
```
simulation in svg mode (if u prefer canvas u can try the official demo)
```

### [USAWindMap](https://elineeen.github.io/d3Trial/#/windCanvas)
origin:http://hint.fm/wind/
```
simulation in canvas mode (the desgin and idea of this work is genius
and fairly hard to be painted in svg due to its performance in massive particles,
i also make some effort at first and you can see the effect below )
```
[demo in svg](https://elineeen.github.io/d3Trial/#/windSVG)

### [anime Sakura](https://elineeen.github.io/d3Trial/#/compositeSakura)
origin:https://cardcaptorsakura.visualcinnamon.com
```
character-chaper relation graph about sakura anime with d3 chord ribbons &
fasinate customized relation lines.
I omitted some annotaiton texts and outer ring elements,
so u'd better try the origin ones first to figure out how it works
```

### [githubIndexPage](https://elineeen.github.io/d3Trial/#/gitIndex)
origin:github.com (the index page canvas)
```
I spend lots of effort on this work, which most of them are wasted 
but using d3 projections & geo apis' is still hard to draw dynamic curves & items out of the sphere's bound,
d3 provides little apis' and supports with spherical projection, which make the process to be extremely hard. 
Maybe other 3d webgl tools will get better outcomes,such as three.js
but i'm entirely fraustrated during all these coordinates transformation trials and this mimic work will not be updated in futher times 
```

### [swooshEffect](https://elineeen.github.io/d3Trial/#/swooshDemo)
origin:https://magiciseverywhere.visualcinnamon.com/ (book legend part)
```
I'm not familiar with the method the original work used in drawing swooshes,
thus spend some time to mimic the effect with a different way(still with lots of code, but i suppose is more readable).
Again, i realized i hate math & algorithms
```

### [transitionCounter](https://elineeen.github.io/d3Trial/#/transitionCounter)
original work(idea comes from https://observablehq.com/@marialuisacp/artistic-d3-line-transition)
```
This work is first an attempt to find a dynamic countdown effect solution on my daily work,
but lack of aesthetic sense result in poor design in number shaping.
HW really made me disgust
```

### [cellular flow](https://elineeen.github.io/d3Trial/#/timeline)
original work(imitate the canvas head banner from https://eruda.liriliri.io/)
```
Back to 2d again lol, this work is fairly intestering in visual effects, but i suppose there's a lot of detail work on the line effect
& logic.
A pratice with tween.js & there's not much things related with d3, i may consider changing this project name to '2d-trial' since 
from now on this repo will be mainly focused in 2D but not just d3 library  
```

### [timelineGraph pt1](https://elineeen.github.io/d3Trial/#/timeline)
original image(https://elineeen.github.io/d3Trial/timelineDemo.png)
```
An original work with tween & canvas2d, the idea came from an illustration of a light novel(Grace Note),
it's quite fascinating in picture so i make some effort to sketch it in a dynamic form
it's only on halfway until finish, and i'll try different forms rather than canvas to paint the PAST part to get some interest lol 
Now i found it a lot harder to get ideas than just immitating visualizations.
```