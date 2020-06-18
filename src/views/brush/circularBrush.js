import * as d3 from 'd3';

export const circularBrush = function() {
    let _extent = [0, Math.PI * 2]
        , _circularBrushDispatch = d3.dispatch('brushstart', 'brushend', 'brush'),
        _arc = d3.arc().innerRadius(50).outerRadius(100),
        _brushData = [
            {startAngle: _extent[0], endAngle: _extent[1], class: "extent"},
            {startAngle: _extent[0] - .2, endAngle: _extent[0], class: "resize e"},
            {startAngle: _extent[1], endAngle: _extent[1] + .2, class: "resize w"}
        ],
        _originalBrushData = {startAngle: _brushData[0].startAngle, endAngle: _brushData[0].endAngle},
        _newBrushData = [],
        d3_window = d3.select(window),
        _origin, _brushG, _handleSize = .2, _scale = d3.scaleLinear().domain(_extent).range(_extent);

    function _circularBrush(_container) {

        _brushG = _container
            .append("g")
            .attr("class", "circularBrush");

        _brushG
            .selectAll("path.circularBrush")
            .data(_brushData)
            .enter()
            // .append("path")
            .insert("path", "path.resize")
            .attr("d", _arc)
            .attr("class", function (d) {
                return d.class + " circularBrush"
            })

        _brushG.select("path.extent")
            .on("mousedown.brush", resizeDown)

        _brushG.selectAll("path.resize")
            .on("mousedown.brush", resizeDown)

        return _circularBrush;
    }
    _circularBrush.on=function(evt,cb){
         _circularBrushDispatch.on(evt,cb);
         return this;
    },
    _circularBrush.extent = function (_value) {
        const _d = _scale.domain(), _r = _scale.range(), _actualScale = d3.scaleLinear()
            .domain([-_d[1], _d[0], _d[0], _d[1]])
            .range([_r[0], _r[1], _r[0], _r[1]])

        if (!arguments.length)
            return [_actualScale(_extent[0]), _actualScale(_extent[1])];

        _extent = [_scale.invert(_value[0]), _scale.invert(_value[1])];
        return this
    }

    _circularBrush.handleSize = function (_value) {
        if (!arguments.length) return _handleSize;
        _handleSize = _value;
        //brush是由三段path组成的,中间扇形区域、左手柄、右手柄，三段path绘制arc而成
        _brushData = [
            {startAngle: _extent[0], endAngle: _extent[1], class: "extent"},
            {startAngle: _extent[0] - _handleSize, endAngle: _extent[0], class: "resize e"},
            {startAngle: _extent[1], endAngle: _extent[1] + _handleSize, class: "resize w"}
        ];
        return this
    }

    _circularBrush.innerRadius = function (_value) {
        if (!arguments.length) return _arc.innerRadius();
        _arc.innerRadius(_value);
        return this
    }

    _circularBrush.outerRadius = function (_value) {
        if (!arguments.length) return _arc.outerRadius();

        _arc.outerRadius(_value);
        return this
    }

    _circularBrush.range = function (_value) {
        if (!arguments.length) return _scale.range();

        _scale.range(_value);
        return this
    }

    _circularBrush.arc = function (_value) {
        if (!arguments.length) return _arc;

        _arc = _value;
        return this

    }

    // d3.rebind(_circularBrush, _circularBrushDispatch, "on");

    return _circularBrush;

    function resizeDown(d) {
        _origin = d3.mouse(_brushG.node());
        if (d.class == "resize e") {
            d3_window
                .on("mousemove.brush", function () {
                    resizeMove("e")
                })
        }
        else if (d.class == "resize w") {
            d3_window
                .on("mousemove.brush", function () {
                    resizeMove("w")
                })
        }
        else {
            d3_window
                .on("mousemove.brush", function () {
                    resizeMove("extent")
                });
        }
        d3_window.on("mouseup.brush", extentUp);
        _circularBrushDispatch.call('brushstart');

    }

    function resizeMove(_resize) {
        var _mouse = d3.mouse(_brushG.node());
        var _current = Math.atan2(_mouse[1], _mouse[0]);
        var _start = Math.atan2(_origin[1], _origin[0]);
        _originalBrushData = {startAngle: _brushData[0].startAngle, endAngle: _brushData[0].endAngle};
        if (_resize == "e") {
            var clampedAngle = Math.max(Math.min(_originalBrushData.startAngle + (_current - _start), _originalBrushData.endAngle), _originalBrushData.endAngle - (2 * Math.PI));

            if (_originalBrushData.startAngle + (_current - _start) > _originalBrushData.endAngle) {
                clampedAngle = _originalBrushData.startAngle + (_current - _start) - (Math.PI * 2);
            }
            else if (_originalBrushData.startAngle + (_current - _start) < _originalBrushData.endAngle - (Math.PI * 2)) {
                clampedAngle = _originalBrushData.startAngle + (_current - _start) + (Math.PI * 2);
            }

            var _newStartAngle = clampedAngle;
            var _newEndAngle = _originalBrushData.endAngle;
        }
        else if (_resize == "w") {
            var clampedAngle = Math.min(Math.max(_originalBrushData.endAngle + (_current - _start), _originalBrushData.startAngle), _originalBrushData.startAngle + (2 * Math.PI))

            if (_originalBrushData.endAngle + (_current - _start) < _originalBrushData.startAngle) {
                clampedAngle = _originalBrushData.endAngle + (_current - _start) + (Math.PI * 2);
            }
            else if (_originalBrushData.endAngle + (_current - _start) > _originalBrushData.startAngle + (Math.PI * 2)) {
                clampedAngle = _originalBrushData.endAngle + (_current - _start) - (Math.PI * 2);
            }

            var _newStartAngle = _originalBrushData.startAngle;
            var _newEndAngle = clampedAngle;
        }
        else {
            var _newStartAngle = _originalBrushData.startAngle + (_current - _start * 1);
            var _newEndAngle = _originalBrushData.endAngle + (_current - _start * 1);
        }
        _newBrushData = [
            {startAngle: _newStartAngle, endAngle: _newEndAngle, class: "extent"},
            {startAngle: _newStartAngle - _handleSize, endAngle: _newStartAngle, class: "resize e"},
            {startAngle: _newEndAngle, endAngle: _newEndAngle + _handleSize, class: "resize w"}
        ]
        _brushG
            .selectAll("path.circularBrush")
            .data(_newBrushData)
            .attr("d", _arc)
        if (_newStartAngle > (Math.PI * 2)) {
            _newStartAngle = (_newStartAngle - (Math.PI * 2));
        }
        else if (_newStartAngle < -(Math.PI * 2)) {
            _newStartAngle = (_newStartAngle + (Math.PI * 2));
        }

        if (_newEndAngle > (Math.PI * 2)) {
            _newEndAngle = (_newEndAngle - (Math.PI * 2));
        }
        else if (_newEndAngle < -(Math.PI * 2)) {
            _newEndAngle = (_newEndAngle + (Math.PI * 2));
        }

        _extent = ([_newStartAngle, _newEndAngle]);

        _circularBrushDispatch.call('brush');

    }

    function extentUp() {

        _brushData = _newBrushData;
        d3_window.on("mousemove.brush", null).on("mouseup.brush", null);

        _circularBrushDispatch.call('brushend');
    }
};
