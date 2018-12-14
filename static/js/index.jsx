class DatasetSelect extends React.Component {
    constructor () {
        super()
        this.state = {'datasets': []}
    }
    componentWillMount () {
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
        this.state = {'checked': false}
    }
    handleClick () {
        this.state.checked = !this.state.checked
        this.props.callBackFunc(this.state.checked)
    }
    render() {
        console.log('Rendering AppendCheckBox')
        return (
            <input type="checkbox"
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
            <GeneBox uid={this.props.uid} height={window.innerHeight*0.4 + 'px'} width={"150px"}
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
        this.state = {'svg': null, 'png': null}
    }
    componentDidUpdate () {
        console.log('Making PNG')
        var svgContainer =  document.querySelector('svg')
        if (svgContainer != null) {
            console.log('svg exists')
            var svgString = 'data:image/svg+xml;base64,' +  btoa(
                new XMLSerializer().serializeToString(svgContainer))
            if (svgString != this.state.svg) {
                this.state.svg = svgString
                var canvas = document.createElement('canvas')
                canvas.width = 550*3
                canvas.height = 500*3
                var ctx = canvas.getContext('2d')
                ctx.scale(3,3)
                var img = new Image()
                img.onload = () => {
                    ctx.drawImage(img, 0, 0)
                    this.setState({'png': canvas.toDataURL()})
                }
                img.src = svgString
            }
        }
    }
    handleClick (v) {
        var a = document.createElement('a');
        a.href = this.state[v]
        a.download = 'CellRadar.' + v
        a.click()
    }
    render () {
        console.log ('Rendering SvgDownload')
        return (
            <div className="row">
                <div className='col-5'>
                {this.state.svg != null ?
                    <button className="btn btn-secondary" onClick={(e) => this.handleClick('svg')}>Download SVG</button>:
                    <a></a>
                }
                </div><div className='col-2'></div>
                <div className='col-5'>
                {this.state.png != null ?
                    <button className="btn btn-secondary" onClick={(e) => this.handleClick('png')}>Download PNG</button>:
                    <a></a>
                }
                </div>
            </div>
        )
    }
}

class CustomLegend extends React.Component {
    render () {
        var svg = d3.select("svg").node()
        if (svg != null) {
            var svgContainer = d3.select("svg")    
            var circle = svgContainer.append("circle")
                .attr("cx", 30)
                .attr("cy", 30)
                .attr("r", 10)
                .attr("transform", "translate(" + svg.getBBox().width + "," + 200 + ")");
        }
        return null
    }
}

class RadarStore extends React.Component {
    constructor () {
        super()
        this.state = {'radarData': [], 'width': null }
    }
    renderChart () {
        console.log('Making chart')
        var radar_bb = document.querySelector(this.props.chartId).getBoundingClientRect()
        var input_bb = document.querySelector(this.props.inputboxId).getBoundingClientRect()
        var radar_width = radar_bb.right - radar_bb.left
        var input_height = input_bb.bottom - input_bb.top
        var plot_wh = Math.min(radar_width*0.7, input_height)
        this.state.width = plot_wh
        RadarChart("#RadarChart", this.state.radarData, {
            'w': plot_wh*0.8,
            'h': plot_wh*0.8,
            'margin': {'top': plot_wh*0.1, 'right': radar_width-plot_wh,
                       'bottom': plot_wh*0.1, 'left': plot_wh*0.2}
        })
        // this.pngCreator()
    }
    render () {
        console.log('Rendering RadarStore')
        if (this.props.data != null) {
             if (this.props.doOverlay) {
                this.state.radarData.push(this.props.data)
            }
            else {
                this.state.radarData = [this.props.data]
            }
            this.renderChart()
        }
        ReactDOM.render(
            <SvgDownload />,
                document.getElementById("SvgDownloadComp"))
        ReactDOM.render(
            <CustomLegend />,
            document.getElementById("CustomLegendEntry"))
        return null
    }
}

class App extends React.Component {
    constructor () {
        super()
        this.state = {
            'geneBoxid': 'geneBox1', 'selectedDataset': '', 'inputGenes': [],
            'SubmitButtonDisabled': false, 'radarData': null, 'doOverlay': false,
        }
    }
    fetchRadarData () {
        console.log('Fetching radarData')
        this.setState({'SubmitButtonDisabled': true, 'radarData': null})
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
            this.setState({'SubmitButtonDisabled': false, 'radarData': null})
            console.log(r.msg)
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
                            callBackFunc={(v, s) => this.handleInputUpdate(v, s)} />
                <RadarStore data={this.state.radarData} doOverlay={this.state.doOverlay}
                            chartId={'#RadarChart'} inputboxId={'#InputBox'} />
            </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("AppEntryPoint")
)
