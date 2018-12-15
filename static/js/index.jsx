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
            var svgString = 'data:image/svg+xml;base64,' +  btoa(
                new XMLSerializer().serializeToString(svgContainer))
            if (this.state.svg != svgString) {
                 this.setState({'svg': svgString})
            }
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
        canvas.width = 550*3
        canvas.height = 500*3
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

class CustomLegend extends React.Component {
    constructor () {
        super()
        this.state = {'colors': []}
    }
    handleChange () {
        console.log(this.state)
    }
    getColors () {
        var colors = []
        var radar_area = d3.selectAll('.radarArea')[0]
        for (var i in radar_area) {
            if (i != 'parentNode') {
                colors.push(radar_area[i].style.fill)
            }
        }
        return colors
    }
    render () {
        this.state.colors = this.getColors()
        if (d3.select("svg").node() != null) {
            console.log(this.state)
            var g = d3.select("svg").append('g')
                .attr("transform", "translate(" + 550 + "," + 100 + ")")
            g.selectAll("circle")
                .data(this.state.colors)
                .enter()
                .append("circle")
                .attr("r", 10)
                .attr("cy", (d,i) => {return 30*i})
                .attr("cx", 0)
                .attr("fill", d => {return d})
                .on("mouseover", function (d,i) {
                    d3.select(this).transition().duration(200).attr({r: 15})
                    d3.selectAll(".radarArea")
                        .transition().duration(200)
                        .style("fill-opacity", 0.1)
                    d3.selectAll(".radarStroke")
                        .transition().duration(200)
                        .style("stroke-width", 0)
                    d3.selectAll(".radarCircle")
                        .transition().duration(200)
                        .style("r", 0)
                    d3.select(d3.selectAll('.radarArea')[0][i])
                        .transition().duration(200)
                        .style("fill-opacity", 0.7)
                })
                .on("mouseout", function (d,i) {
                    d3.select(this).transition().duration(200).attr({r: 10})
                    d3.selectAll(".radarArea")
                        .transition().duration(200)
                        .style("fill-opacity", 0.7)
                    d3.selectAll(".radarStroke")
                        .transition().duration(200)
                        .style("stroke-width", 2)
                    d3.selectAll(".radarCircle")
                        .transition().duration(200)
                        .style("r", 2)
                })
                .on("click", function (d, i) {
                    d3.select(this).moveToFront();
                })
        }
        return null
    }
}

class RadarStore extends React.Component {
    constructor () {
        super()
        this.state = {'radarData': [], 'info': []}
    }
    componentDidUpdate () {
        if (this.props.data == '') {
            console.log('Will not touch chart')
        } else {
            d3.select(this.props.radarId).select("svg").remove()
            if (this.props.data != null) {
                if (this.props.doOverlay) {
                    this.state.radarData.push(this.props.data)
                    this.state.info.push({
                        'name': 'List ' + this.state.info.length + 1,
                        'color': null
                    })
                } else {
                    this.state.radarData = [this.props.data]
                    this.state.info = [{'name': 'List 1', 'color': null}]
                }
                this.renderChart()
            }  else {
                console.log('Will not make chart, scrap data')
                this.state.radarData = [] // Scrap existing data
                this.state.info = []
            }
            this.setState()
        }
    }
    renderChart () {
        console.log('Making chart')
        RadarChart(this.props.radarId, this.state.radarData, {
            'w': this.props.radarWidth,
            'h': this.props.radarWidth,
            'margin': this.props.radarMargin
        })
    }
    render () {
        console.log('Rendering RadarStore')
        ReactDOM.render(
            <SvgDownload />,
                document.getElementById("SvgDownloadComp"))
        ReactDOM.render(
            <CustomLegend info={this.state.info} />,
            document.getElementById("CustomLegendEntry"))
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

        this.state.radarWidth = 0.7*radar_bb_width
        this.state.radarMargin = {
            'top': radar_bb_width*0.1, 'bottom': radar_bb_width*0.1, 
            'left': radar_bb_width*0.2,
            'right': radar_bb_width*0.1 + radar_bb_width-this.state.radarWidth, 
        }
        this.state.geneBoxHeight = this.state.radarWidth*0.91 + 'px'
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
