class DatasetSelect extends React.Component {
    constructor () {
        super()
        this.state = {'datasets': []}
    }
    componentDidMount () {
        console.log('Fetching Datatset')
        fetch('/getdatasets')
            .then(response => response.json())
            .then(r => {
                this.setState({'datasets': r['datasets']})
                this.props.callBackFunc(r['datasets'][0]['value'])
            })
    }
    render () {
        console.log('Rendering DatasetSelect')
        return (
            <select style={{"font-size":"16px"}}
                onInput={e => this.props.callBackFunc(e.target.value)}>
                {this.state.datasets.map(item => (
                    <option key={item.id}>{item.value}</option>
                ))}
            </select>
        )
    }
}

class GeneBox extends React.Component {
    onTextUpdate(v) {
        this.props.callBackFunc(v.split("\n").filter(g => g.length > 0))
    }
    render () {
        console.log('Rendering GeneBox')
        return (
            <textarea id={this.props.uid} 
                style={{'width':this.props.width, 'height':this.props.height}}
                onInput={e => this.onTextUpdate(e.target.value)} />
        )
    }
}

class AppendCheckBox extends React.Component {
    constructor () {
        super()
        this.state = {'checked': true}
    }
    handleClick () {
        this.state.checked = !this.state.checked
        this.props.callBackFunc(this.state.checked)
    }
    render() {
        console.log('Rendering AppendCheckBox')
        return (
            <input type="checkbox" defaultChecked={this.state.checked}
                onInput={(e) => this.handleClick()}/>
        )   
    }
}

class InputStore extends React.Component {
    shouldComponentUpdate() {
        return false
    }
    render () {
        console.log('Rendering InputStore')
        ReactDOM.render(
            <DatasetSelect
                callBackFunc={v => this.props.callBackFunc(v, 'selectedDataset')} />,
            document.getElementById("DatasetSelectComp"))
        ReactDOM.render(
            <GeneBox uid={this.props.uid}
                    height={this.props.geneBoxHeight} width={this.props.geneBoxWidth}
                    callBackFunc={v => this.props.callBackFunc(v, 'inputGenes')} />,
            document.getElementById("GeneBoxComp"))
        ReactDOM.render(
            <AppendCheckBox
                callBackFunc={(v) => this.props.callBackFunc(v, 'doOverlay')}/>,
            document.getElementById("AppendCheckBoxComp"))
        return null
    }
}

class SubmitButton extends React.Component {
    render() {
        console.log('Rendering SubmitButton')
        return (
            <div>
                {this.props.isDisabled ?
                    <button className="btn" disabled>Wait</button>:
                    <button className="btn btn-info"
                            onClick={this.props.callBackFunc}>Submit</button>
                }
            </div>
        )   
    }
}

class SvgDownload extends React.Component {
    constructor () {
        super()
        this.state = {'svg': null}
    }
    componentDidUpdate () {
        var svgContainer =  document.querySelector('svg')
        if (svgContainer == null) {
            if (this.state.svg != null) {
                this.setState({'svg': null})
            }
        } else {
            d3.select('.closeWrapper').style('visibility', 'hidden')
            var svgString = 'data:image/svg+xml;base64,' +  btoa(
                new XMLSerializer().serializeToString(svgContainer))
            if (this.state.svg != svgString) {
                 this.setState({'svg': svgString})
            }
            d3.select('.closeWrapper').style('visibility', 'visible')
        }
    }
    handleDownload(data, ext) {
        var a = document.createElement('a')
        a.href = data
        a.download = 'CellRadar.' + ext
        a.click()
    }
    handlePngClick () {
        var canvas = document.createElement('canvas')
        canvas.width = 3*(this.props.radarWidth+
                          this.props.radarMargin.left+
                          this.props.radarMargin.right)
        canvas.height = 3*(this.props.radarWidth+
                           this.props.radarMargin.top+
                           this.props.radarMargin.bottom)
        var ctx = canvas.getContext('2d')
        ctx.scale(3,3)
        var img = new Image()
        img.onload = () => {
            ctx.drawImage(img, 0, 0)
            this.handleDownload(canvas.toDataURL(), 'png')
        }
        img.src = this.state.svg
    }
    render () {
        console.log ('Rendering SvgDownload')
        return (
            <div>
                {this.state.svg != null ?
                    <button className="btn btn-secondary" style={{'margin-right': '5px'}}
                            onClick={(e) => this.handleDownload(this.state.svg, 'svg')}>
                        SVG
                    </button>:
                    <a></a>
                }
                {this.state.svg != null ?
                    <button className="btn btn-secondary"
                            onClick={(e) => this.handlePngClick()}>
                        PNG
                    </button>:
                    <a></a>
                }
            </div>
        )
    }
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

class RadarStore extends React.Component {
    constructor () {
        super()
        this.state = {
            'radarData': [], 'alpha': {'onVal': 0.7, 'offVal': 0.1},
            'linewidth': {'onVal': 2, 'offVal': 0.5},
            'circleRadius': {'onVal': 2, 'offVal': 1},
            'legendRadius': {'val': 10, 'onVal': 15},
            'legendText': []
        }
    }
    checkPropChange () {

    }
    componentDidUpdate (prevProps, prevState) {
        if (this.props.data == '') {
            console.log('Will not touch chart')
            return false
        }
        if (this.props.data == null) {
            if (prevProps.data != null) {
                console.log('Will not make chart, scrap data')
                this.state.radarData = []
                this.state.legendText = []
                d3.select(this.props.radarId).select("svg").remove()
                this.setState(this.state)
                return true
            }
            else {
                console.log("No prop change, will not touch chart")
                return false
            }
        }
        if (prevProps.data != null && prevProps.data != '') {
            var a = this.props.data.map((d) => {return d.value}).reduce((a, b) => a + b, 0)
            var b = prevProps.data.map((d) => {return d.value}).reduce((a, b) => a + b, 0)
            if (a == b) {
                console.log("No prop change, will not touch chart")
                return false
            }
        }
        if (this.state.radarData.length == 10) {
            alert ('Only upto 10 gene lists can be overlaid!')
            return false
        } 
        if (this.props.doOverlay) {
            this.state.radarData.push(this.props.data)
            this.state.legendText.push('List ' + this.state.radarData.length)
        }
        else {
            this.state.radarData = [this.props.data]
            this.state.legendText = ['List 1']
        }
        this.renderChart()
        this.setState(this.state)
    }
    handleLegendClick (i) {
        console.log('Updating order')
        this.state.radarData.push(this.state.radarData.splice(i, 1)[0])
        this.state.legendText.push(this.state.legendText.splice(i, 1)[0])
        console.log(this.state)
        this.renderChart()
        this.setState(this.state)
    }
    handleNameUpdate (i) {
        console.log('Updating name')
        this.state.legendText[i] = document.getElementsByClassName(
            'legendText')[i].firstChild.innerText
        console.log(this.state)
        this.setState(this.state)
    }
    handleCloseClick (i) {
        console.log('Removing ' + i)
        this.state.radarData.splice(i, 1)
        this.state.legendText.splice(i, 1)
        if (this.state.radarData.length > 0) {
            this.renderChart()
        }
        else {
            console.log('last element removed. removing  chart')
            d3.select(this.props.radarId).select("svg").remove()
        }
        this.setState(this.state)
    }
    handleCloseMouseOn (i) {
        d3.select(d3.selectAll(".closeCross1")[0][i])
            .transition().duration(50)
            .style("stroke-width", 2)
        d3.select(d3.selectAll(".closeCross2")[0][i])
            .transition().duration(50)
            .style("stroke-width", 2)
    }
    handleCloseMouseOut (i) {
        d3.select(d3.selectAll(".closeCross1")[0][i])
            .transition().duration(50)
            .style("stroke-width", 1)
        d3.select(d3.selectAll(".closeCross2")[0][i])
            .transition().duration(50)
            .style("stroke-width", 1)
    }
    selectElementOn (i) {
        d3.select(d3.selectAll(".radarArea")[0][i])
            .transition().duration(200)
            .style("fill-opacity", this.state.alpha.onVal)
        d3.select(d3.selectAll(".radarStroke")[0][i])
            .transition().duration(200)
            .style("stroke-width", this.state.linewidth.onVal)
        d3.select(d3.selectAll(".legendCircle")[0][i])
            .transition().duration(100)
            .style("r", this.state.legendRadius.onVal)
    }
    onMouseOver (i) {
        d3.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", this.state.alpha.offVal)
        d3.selectAll(".radarStroke")
            .transition().duration(200)
            .style("stroke-width", this.state.linewidth.offVal)
        d3.selectAll(".radarCircle")
            .transition().duration(200)
            .style("r", this.state.circleRadius.offVal)
        this.selectElementOn(i)
    }
    onMouseOut (i) {
        d3.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", this.state.alpha.onVal)
        d3.selectAll(".radarStroke")
            .transition().duration(200)
            .style("stroke-width", this.state.linewidth.onVal)
        d3.selectAll(".radarCircle")
            .transition().duration(200)
            .style("r", this.state.circleRadius.onVal)
        d3.select(d3.selectAll(".legendCircle")[0][i])
            .transition().duration(100)
            .style("r", this.state.legendRadius.val)
    }
    renderChart () {
        console.log('Making chart')
        console.log(this.state.radarData)

        var data = this.state.radarData
        var id  = this.props.radarId
        var cfg = {
            w: this.props.radarWidth, h: this.props.radarWidth,
            margin: this.props.radarMargin,
            levels: 5,
            maxValue: 1,
            labelFactor: 1.15,
            wrapWidth: 80,
            opacityArea: this.state.alpha.onVal,
            dotRadius: this.state.circleRadius.onVal,
            legendRadius: this.state.legendRadius.val,
            legendText: this.state.legendText,
            opacityCircles: 0.1,
            strokeWidth: this.state.linewidth.onVal,
            color: d3.scale.category10(),
            closeRadius: 7,
            legendX: 20,
            legendY: 30,
        }
        d3.select(id).select("svg").remove()
        var allAxis = (data[0].map(function(i, j){return i.axis}))
        var total = allAxis.length
        var radius = Math.min(cfg.w/2, cfg.h/2)
        var Format = d3.format('%')
        var angleSlice = Math.PI * 2 / total
        var rScale = d3.scale.linear()
            .range([0, radius])
            .domain([0, cfg.maxValue])
        var svg = d3.select(id).append("svg")
            .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
            .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
            .attr("class", "radar"+id)
        var g = svg.append("g")
            .attr("transform", "translate(" +
                    (cfg.w/2 + cfg.margin.left) + 
                    "," + (cfg.h/2 + cfg.margin.top) + ")")
        
        var filter = g.append('defs').append('filter').attr('id','glow'),
            feGaussianBlur = filter.append('feGaussianBlur')
                .attr('stdDeviation','2.5')
                .attr('result','coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode')
                .attr('in','coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode')
                .attr('in','SourceGraphic')

        var axisGrid = g.append("g").attr("class", "axisWrapper")
        axisGrid.selectAll(".levels")
           .data(d3.range(1,(cfg.levels+1)).reverse())
           .enter()
           .append("circle")
           .attr("class", "gridCircle")
           .attr("r", function(d, i){return radius/cfg.levels*d;})
           .style("fill", "#CDCDCD")
           .style("stroke", "#CDCDCD")
           .style("fill-opacity", cfg.opacityCircles)
           .style("filter" , "url(#glow)")
        var axis = axisGrid.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis")
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", function(d, i){ return rScale(cfg.maxValue*1.1) *
                Math.cos(angleSlice*i - Math.PI/2)})
            .attr("y2", function(d, i){ return rScale(cfg.maxValue*1.1) *
                Math.sin(angleSlice*i - Math.PI/2)})
            .attr("class", "line")
            .style("stroke", "white")
            .style("stroke-width", "2px")
        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "12px")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", function(d, i){ return rScale(cfg.maxValue * cfg.labelFactor) *
                Math.cos(angleSlice*i - Math.PI/2)})
            .attr("y", function(d, i){ return rScale(cfg.maxValue * cfg.labelFactor) *
                Math.sin(angleSlice*i - Math.PI/2)})
            .text(function(d){return d})
            .call(textWrap, cfg.wrapWidth)
        var radarLine = d3.svg.line.radial()
            .interpolate("cardinal-closed")
            .radius(function(d) { return rScale(d.value)})
            .angle(function(d,i) {  return i*angleSlice})
        var blobWrapper = g.selectAll(".radarWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarWrapper")
        blobWrapper
            .append("path")
            .attr("class", "radarArea")
            .attr("d", function(d,i) { return radarLine(d)})
            .style("fill", function(d,i) { return cfg.color(i)})
            .style("fill-opacity", cfg.opacityArea)
            .on('mouseover',  (d, i) => {this.onMouseOver(i)})
            .on('mouseout', (d, i) => {this.onMouseOut(i)})
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", function(d,i) { return radarLine(d)})
            .style("stroke-width", cfg.strokeWidth + "px")
            .style("stroke", function(d,i) { return cfg.color(i)})
            .style("fill", "none")
            .style("filter" , "url(#glow)")
        blobWrapper.selectAll(".radarCircle")
            .data(function(d,i) { return d })
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", cfg.dotRadius)
            .attr("cx", function(d,i){ return rScale(d.value) *
                Math.cos(angleSlice*i - Math.PI/2)})
            .attr("cy", function(d,i){ return rScale(d.value) *
                Math.sin(angleSlice*i - Math.PI/2)})
            .style("fill", function(d,i,j) { return cfg.color(j)})
            .style("fill-opacity", 0.8)
        var legendWrapper = svg.append("g")
            .attr("transform", "translate(" + (cfg.w+cfg.margin.left+50) + "," + cfg.margin.top + ")")
        legendWrapper.selectAll(".legendCircle")
            .data(d3.range(data.length))
            .enter().append("circle")
            .attr("class", "legendCircle")
            .attr("r", cfg.legendRadius)
            .attr("cy", (d) => {return cfg.legendY *d})
            .attr("cx", cfg.legendX + 25)
            .style("fill", (d) => { return cfg.color(d)})
            .on('mouseover', (d) => {this.onMouseOver(d)})
            .on('mouseout', (d) => {this.onMouseOut(d)})
            .on('click', (d) => {this.handleLegendClick(d)})
        legendWrapper.selectAll(".legendText")
            .data(d3.range(data.length))
            .enter().append("foreignObject")
            .attr("class", "legendText")
            .attr("x", cfg.legendX+25+15)
            .attr("y", (d) => {return cfg.legendY*d-14})
            .attr("width", cfg.margin.right-cfg.margin.left-(cfg.legendX+25) + "px")
            .attr("height", "20px")
            .append('xhtml:div')
            .append('div')
            .attr("contentEditable", true)
            .text(function(d) { return cfg.legendText[d]})
            .on('mouseover', (d) => {this.onMouseOver(d)})
            .on('mouseout', (d) => {this.onMouseOut(d)})
            .on('input', (d) => {this.handleNameUpdate(d)})
        var closeWrapper = svg.append("g")
                            .attr("class", "closeWrapper")
                            .attr("transform", "translate(" + (cfg.w+cfg.margin.left+50) + "," + cfg.margin.top + ")")
        closeWrapper.selectAll(".closeCircle")
            .data(d3.range(data.length))
            .enter().append("circle")
            .attr("class", "closeCircle")
            .attr("cx", cfg.legendX)
            .attr("cy", (d) => {return cfg.legendY*d})
            .attr("r", cfg.closeRadius) 
            .style("fill-opacity", 0)
            .style("stroke-width", "1px")
            .style("stroke", "black")
            .on("click",  (d) => {this.handleCloseClick(d)})
            .on("mouseover",  (d) => {this.handleCloseMouseOn(d)})
            .on("mouseout",  (d) => {this.handleCloseMouseOut(d)})
        closeWrapper.selectAll(".closeCross1")
            .data(d3.range(data.length))
            .enter().append("line")
            .attr("class", "closeCross1")
            .attr("x1", cfg.legendX-cfg.closeRadius+3)
            .attr("y1", (d) => {return cfg.legendY*d})
            .attr("x2", cfg.legendX+cfg.closeRadius-3)
            .attr("y2", (d) => {return cfg.legendY*d})
            .style("stroke-width", "1px")
            .style("stroke", "black")
            .attr("transform", (d) => {return "rotate (45," + cfg.legendX + "," + cfg.legendY*d + ")" })
            .on("click", (d) => {this.handleCloseClick(d)})
            .on("mouseover",  (d) => {this.handleCloseMouseOn(d)})
            .on("mouseout",  (d) => {this.handleCloseMouseOut(d)})
        closeWrapper.selectAll(".closeCross2")
            .data(d3.range(data.length))
            .enter().append("line")
            .attr("class", "closeCross2")
            .attr("x1", cfg.legendX)
            .attr("y1", (d) => {return cfg.legendY*d-cfg.closeRadius+3})
            .attr("x2", cfg.legendX)
            .attr("y2", (d) => {return cfg.legendY*d+cfg.closeRadius-3})
            .style("stroke-width", "1px")
            .style("stroke", "black")
            .attr("transform", (d) => {return "rotate (45," + cfg.legendX + "," + cfg.legendY*d + ")" })
            .on("click", (d) => {this.handleCloseClick(d)})
            .on("mouseover",  (d) => {this.handleCloseMouseOn(d)})
            .on("mouseout",  (d) => {this.handleCloseMouseOut(d)})
    }
    render () {
        console.log('Rendering RadarStore')
        ReactDOM.render(
            <SvgDownload radarWidth={this.props.radarWidth}
                         radarMargin={this.props.radarMargin}
                         dummy={this.state.radarData.length} />,
                document.getElementById("SvgDownloadComp"))
        return null
    }
}

class App extends React.Component {
    constructor () {
        super()
        this.state = {
            'geneBoxid': 'geneBox1', 'selectedDataset': '', 'inputGenes': [],
            'SubmitButtonDisabled': false, 'radarData': '', 'doOverlay': true,
            'inputId': 'InputStoreEntry', 'radarId': '#RadarChart', 
            'geneBoxHeight': null, 'geneBoxWidth': null,
            'radarMargin': null, 'radarWidth': null
        }
        this.makeDimensions()
    }
    componentDidUpdate () {
        this.state.radarData = ''
    }
    makeDimensions () {
        var radar_bb = document.querySelector(this.state.radarId).getBoundingClientRect()
        var radar_bb_width = radar_bb.right - radar_bb.left
        var radar_height =  Math.min(window.outerHeight*0.7, radar_bb_width)

        this.state.radarWidth = 0.7*radar_height
        this.state.radarMargin = {
            'top': radar_height*0.1, 'bottom': radar_height*0.1, 
            'left': radar_height*0.2,
            'right': radar_height*0.1 + radar_bb_width-radar_height, 
        }
        this.state.geneBoxHeight = this.state.radarWidth*0.8 + 'px'
        this.state.geneBoxWidth = '150px'
        console.log(this.state)
    }
    fetchRadarData () {
        console.log('Fetching radarData')
        this.setState({'SubmitButtonDisabled': true})
        const req_data = {
            method: "POST",
            headers: {"Content-Type": "application/json; charset=utf-8"},
            body: JSON.stringify({
                'dataset': this.state.selectedDataset,
                'genes': this.state.inputGenes})        
        }
        fetch('/makeradar', req_data)
            .then(response => response.json())
            .then(r => this.handleRadarData(r))
    }
    handleRadarData (r) {
        if (r.msg == 'OK') {
            const data = r.cells.map((i,n) => {return {'axis':i, 'value':r.ylist[0][n]}})
            document.getElementById(this.state.geneBoxid).value = r['genes']
            this.setState({'SubmitButtonDisabled': false, 'radarData': data})
        }
        else {
            alert (r.msg)
            this.setState({'SubmitButtonDisabled': false})
        }
    }
    handleInputUpdate (v, s) {
        this.state[s] = v
        if (s == 'selectedDataset') {
            this.setState({'radarData': null})
        }
        console.log(s, v)
    }
    render () {
        console.log('Rendering App')
        ReactDOM.render(
            <SubmitButton isDisabled={this.state.SubmitButtonDisabled}
                          callBackFunc={() => this.fetchRadarData()} />,
            document.getElementById("SubmitButtonComp"))
        return (
            <div>
                <InputStore uid={this.state.geneBoxid}
                    callBackFunc={(v, s) => this.handleInputUpdate(v, s)} 
                    geneBoxHeight={this.state.geneBoxHeight}
                    geneBoxWidth={this.state.geneBoxWidth} />
                <RadarStore data={this.state.radarData} doOverlay={this.state.doOverlay}
                    radarId={this.state.radarId} radarMargin={this.state.radarMargin}
                    radarWidth={this.state.radarWidth} />
            </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("AppEntryPoint")
)
