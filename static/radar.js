const radarCfg = {
    'opacity': {'base': 0.7, 'on': 0.8, 'off': 0.2},
    'stroke': {'base': 2, 'on': 3, 'off': 0.5},
    'radiusDot': {'base': 2, 'on': 3, 'off': 0.5},
    'radiusLegend': {'base': 10, 'on': 15, 'off': 0},
    'radiusCloseBtn': {'base': 6.5, 'on': 10, 'off': 0},
    'strokeClose': {'base': 1.1, 'on': 1.5, 'off': 0},
    'closeLineFrac': 0.7
}

function toggleHighlight (i, a, b, c, t) {
    let x = d3.select('.radarWrapper' + i).transition().duration(t)
    x.select('.radarArea').style('fill-opacity', a)
    x.select('.radarStroke').style('stroke-width', b)
    x.selectAll('.radarCircle').style('r', c)
}

function coordinateHighlight (i, event, hiddenData, allUid) {
    const t = 200
    if (hiddenData[i].hidden == false) {
        if (event == 'mouseover') {
            toggleHighlight(i, radarCfg.opacity.on,
             radarCfg.stroke.on, radarCfg.radiusDot.on, t)
        }
        else if (event == 'mouseout') {
            toggleHighlight(i, radarCfg.opacity.base,
             radarCfg.stroke.base, radarCfg.radiusDot.base, t)
        }
        else {
            return false
        }
        allUid.forEach( function (j) {
            if (j != i) {
                if (hiddenData[j].hidden == false) {
                    if (event == 'mouseover') {
                       toggleHighlight(j, radarCfg.opacity.off,
                        radarCfg.stroke.off, radarCfg.radiusDot.off, t)
                    }
                    else {
                        toggleHighlight(j, radarCfg.opacity.base,
                            radarCfg.stroke.base, radarCfg.radiusDot.base, t)
                    }
                }
            }
        })
    }
    return true
}

function toggleVisibility (i) {
    let x = d3.select('.radarWrapper' + i)
    const checked = d3.select('.hideBtn' + i)[0][0].checked
    if (checked) {
        toggleHighlight(i, radarCfg.opacity.base,
            radarCfg.stroke.base, radarCfg.radiusDot.base, 0)
    }
    else {
        toggleHighlight(i, 0, 0, 0, 0)
    }
}

function toggleCloseBtn (i, event) {
    let x = d3.select('.closeBtnWrapper' + i).selectAll('line')
    if (event == 'mouseover') {
        x.style("stroke-width", radarCfg.strokeClose.on)
    }
    else if (event == 'mouseout') {
        x.style("stroke-width", radarCfg.strokeClose.base)   
    }
}

function removePlot (i) {
    d3.select('.radarWrapper' + i).remove()
    let x = d3.select('.sideInfoWrapper')[0][0].children
    Array.from(x).forEach(function (i) {i.remove()})
}

function bringToFront(i) {
    d3.selectAll('.radarWrapper' + i)
        .each(function() {
            this.parentNode.appendChild(this)
        })
}

function textWrap(text, width) {
    text.each(function() {
        var text = d3.select(this)
        var words = text.text().split(/\s+/).reverse()
        var word
        var line = []
        var lineNumber = 0
        var lineHeight = 1.4
        var y = text.attr("y")
        var x = text.attr("x")
        var dy = parseFloat(text.attr("dy"))
        var tspan = text.text(null).append("tspan")
            .attr("x", x).attr("y", y).attr("dy", dy + "em")
        while (word = words.pop()) {
            line.push(word)
            tspan.text(line.join(" "))
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x).attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word)
            }
        }
    })
}

function initializeSvg (id, figwidth, margins) {
    console.log('Initialize SVG')
    d3.select(id).select("svg").remove()
    let svg = d3.select(id).append("svg")
        .attr("width",  figwidth + margins.left + margins.right)
        .attr("height", figwidth + margins.top + margins.bottom)
        .attr("class", id)
        .style("shape-rendering", "geometricPrecision")
    const filter = svg.append('defs').append('filter')
                    .attr('id','glow')
    filter.append('feGaussianBlur')
         .attr('stdDeviation','2.5')
         .attr('result','coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in','coloredBlur')
    feMerge.append('feMergeNode').attr('in','SourceGraphic')
    svg.append("g")
        .attr("transform", "translate(" +
            (figwidth/2 + margins.left) + 
            "," + (figwidth/2 + margins.top) + ")")
        .attr('class', 'mainG')
    svg.append("g")
        .attr("class", "sideInfoWrapper")
        .attr("transform", "translate(" + 
            (figwidth+margins.left*2) +
            "," + margins.top + ")")
}

function resetSvgData () {
    d3.selectAll('.plotWrapper').remove()
    d3.select('.mainG')
        .append("g")
        .attr("class", "plotWrapper")
    let x = d3.select('.sideInfoWrapper')[0][0].children
    Array.from(x).forEach(function (i) {i.remove()})
}

function plotAxis(axisNames, figwidth) {
    console.log('Making Axis')
    var radius = Math.min(figwidth/2, figwidth/2)
    var angleSlice = Math.PI * 2 / axisNames.length
    var rScale = d3.scale.linear()
        .range([0, radius])
        .domain([0, 1])
    
    d3.selectAll('.axisWrapper').remove()
    var axisGrid = d3.select('.mainG')
                    .append("g")
                    .attr("class", "axisWrapper")
    axisGrid.selectAll(".levels")
       .data(d3.range(1,(5+1)).reverse())
       .enter()
       .append("circle")
       .attr("class", "gridCircle")
       .attr("r", function(d, i){return radius/5*d;})
       .style("fill", "#CDCDCD")
       .style("stroke", "#CDCDCD")
       .style("fill-opacity", 0.1)
       .style("filter" , "url(#glow)")
    var axis = axisGrid.selectAll(".axis")
        .data(axisNames)
        .enter()
        .append("g")
        .attr("class", "axis")
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return rScale(1.1) *
            Math.cos(angleSlice*i - Math.PI/2)})
        .attr("y2", function(d, i){ return rScale(1.1) *
            Math.sin(angleSlice*i - Math.PI/2)})
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px")
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", figwidth/35 + "px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return rScale(1.15) *
            Math.cos(angleSlice*i - Math.PI/2)})
        .attr("y", function(d, i){ return rScale(1.15) *
            Math.sin(angleSlice*i - Math.PI/2)})
        .text(function(d){return d})
        .call(textWrap, figwidth/5)
    
    d3.selectAll('.plotWrapper').remove()
    d3.select('.mainG')
        .append("g")
        .attr("class", "plotWrapper")
}

function plotRadar(uid, data, color, numCells, figwidth, callBackFunc) {
    console.log('Plotting Radar Area')
    var radius = Math.min(figwidth/2, figwidth/2)
    var angleSlice = Math.PI * 2 / numCells
    var rScale = d3.scale.linear()
        .range([0, radius])
        .domain([0, 1])
    var radarLine = d3.svg.line.radial()
            .interpolate("cardinal-closed")
            .radius(function(d) { return rScale(d)})
            .angle(function(d,i) {  return i*angleSlice})
    var blobWrapper = d3.select('.plotWrapper').append("g")
                        .attr("class", "radarWrapper" + uid)
        blobWrapper
            .append("path")
            .attr("class", "radarArea")
            .attr("d", radarLine(data))
            .style("fill", color)
            .style("fill-opacity", radarCfg.opacity.base)
            .on('mouseover', function() {callBackFunc(uid, 'mouseover')})
            .on('mouseout', function() {callBackFunc(uid, 'mouseout')})
            .on('click', function () {bringToFront(uid)})
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", radarLine(data))
            .style("stroke-width", radarCfg.stroke.base + "px")
            .style("stroke", color)
            .style("fill", "none")
            .style("filter" , "url(#glow)")
        blobWrapper.selectAll(".radarCircle")
            .data(data)
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", radarCfg.radiusDot.base)
            .attr("cx", function(d, i) { return rScale(d) *
                Math.cos(angleSlice*i - Math.PI/2)})
            .attr("cy", function(d, i){ return rScale(d) *
                Math.sin(angleSlice*i - Math.PI/2)})
            .style("fill", color)
            .style("fill-opacity", 0.8)
}

function addSideGroup (uid) {
    d3.select('.sideInfoWrapper')
        .append("g")
        .attr("class", "sideGroup" + uid)
}

function makeCloseButton (uid, ypos, callBackAni, callBackRem) {
    var closeWrapper = d3.select(".sideGroup" + uid)
                        .append("g")
                        .attr("class", "closeBtnWrapper" + uid)
    closeWrapper.append("circle")
        .attr("class", "closeCircle")
        .attr("cx", 0).attr("cy", ypos)
        .attr("r", radarCfg.radiusCloseBtn.base)
        .style("fill-opacity", 0)
        .style("stroke-width", radarCfg.strokeClose.base)
        .style("stroke", "black")
    closeWrapper.append("line")
        .attr("x1", -radarCfg.radiusCloseBtn.base*radarCfg.closeLineFrac)
        .attr("x2", radarCfg.radiusCloseBtn.base*radarCfg.closeLineFrac)
        .attr("y1", ypos)
        .attr("y2", ypos)
        .style("stroke-width", radarCfg.strokeClose.base)
        .style("stroke", "black")
    closeWrapper.append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", ypos-radarCfg.radiusCloseBtn.base*radarCfg.closeLineFrac)
        .attr("y2", ypos+radarCfg.radiusCloseBtn.base*radarCfg.closeLineFrac)
        .style("stroke-width", radarCfg.strokeClose.base)
        .style("stroke", "black")
    closeWrapper.attr("transform", "rotate (45," + 0 + "," + ypos + ")" )
                .on("mouseover", function() {callBackAni(uid, 'mouseover')})
                .on("mouseout",  function() {callBackAni(uid, 'mouseout')})
                .on("click", function() {callBackRem(uid)})
}

function makeHideToggle (uid, ypos, callBackFunc) {
    d3.select(".sideGroup" + uid)
        .append("foreignObject")
        .attr("x", radarCfg.radiusCloseBtn.base*2)
        .attr("y", ypos-10)
        .attr('class', 'hideBtnWrapper' + uid)
        .append('xhtml:div')
        .append('input')
        .attr('class', 'hideBtn' + uid)
        .attr('type', 'checkbox')
        .property('checked', true)
        .on("click", function() {callBackFunc(uid)})
}

function makeLegend(uid, ypos, width, fontsize, text, color, callBackFunc, callBackText) {
    var legendWrapper = d3.select(".sideGroup" + uid)
                            .append("g")
                            .attr("class", "legendWrapper" + uid)
    legendWrapper.append("circle")
        .attr("class", "legendCircle")
        .attr("r", radarCfg.radiusLegend.base)
        .attr("cy", ypos)
        .attr("cx", 10 + radarCfg.radiusCloseBtn.base*2+radarCfg.radiusLegend.on)
        .style("fill", color)
        .on('mouseover', function() {callBackFunc(uid, 'mouseover')})
        .on('mouseout', function() {callBackFunc(uid, 'mouseout')})
    legendWrapper.append("foreignObject")
        .attr("x", 10 + radarCfg.radiusCloseBtn.base*2+radarCfg.radiusLegend.on*2)
        .attr("y", ypos-10)
        .attr("width", width + "px")
        .attr("height", fontsize*1.5 + "px")
        .append('xhtml:div')
        .append('div')
        .attr("contentEditable", true)
        .style("font-size", fontsize + "px")
        .text(text)
        .on('input', function () {callBackText(this.textContent)})
}
