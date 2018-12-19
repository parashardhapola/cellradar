class DatasetSelect extends React.Component {
    shouldComponentUpdate(nextProps) {
        if (this.props.datasets.length == nextProps.datasets.length) {
            return false
        }
        return true
    }
    render () {
        console.log('Rendering DatasetSelect')
        return (
            <select style={{"font-size": this.props.fontsize}}
                onInput={e => this.props.callBackFunc(e.target.value)}>
                {this.props.datasets.map(item => (
                    <option key={item.id}>{item.value}</option>
                ))}
            </select>
        )
    }
}

class GeneBox extends React.Component {
    shouldComponentUpdate() {
        return false
    }
    onTextUpdate(v) {
        this.props.callBackFunc(v.split("\n").filter(g => g.length > 0))
    }
    render () {
        console.log('Rendering GeneBox')
        return (
            <textarea id={this.props.id} 
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
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.checked == nextState.checked) {
            return false
        }
        return true
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

class SubmitButton extends React.Component {
    shouldComponentUpdate(nextProps) {
        if (this.props.isDisabled == nextProps.isDisabled) {
            return false
        }
        return true
    }
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
    makeSvg () {
        if (document.querySelector('svg') != null) {
            const dummysvg = d3.select('body')
                            .append('div')
                            .attr('class', 'dummydivfordownload')
                            .html(d3.select('svg')[0][0].outerHTML)
            dummysvg.select('.closeWrapper')[0][0].remove()
            dummysvg.select('.hideWrapper')[0][0].remove()
            const svgString = 'data:image/svg+xml;base64,' +  btoa(
                new XMLSerializer().serializeToString(dummysvg.node()))
            d3.selectAll('.dummydivfordownload').remove()
            return svgString
        }
    }
    handleDownload(data, ext) {
        const a = document.createElement('a')
        a.href = data
        a.download = 'CellRadar.' + ext
        a.click()
    }
    handlePngClick () {
        console.log('Making PNG')
        const canvas = document.createElement('canvas')
        canvas.width = 3*(this.props.radarWidth+
                          this.props.radarMargin.left+
                          this.props.radarMargin.right)
        canvas.height = 3*(this.props.radarWidth+
                           this.props.radarMargin.top+
                           this.props.radarMargin.bottom)
        const ctx = canvas.getContext('2d')
        ctx.scale(3,3)
        const img = new Image()
        img.src = this.makeSvg()
        img.onload = function() {
            console.log('PNG loaded')
            console.log(canvas)
            ctx.drawImage(img, 0, 0)
            this.handleDownload(canvas.toDataURL(), 'png')
        }
    }
    handleSvgClick () {
        this.handleDownload(this.makeSvg(), 'svg')
    }
    render () {
        if (document.querySelector('svg') == null) {
            const showbuttons = false
        }
        else {
            const showbuttons = true   
        }
        console.log ('Rendering SvgDownload')
        return (
            <div>
                {showbuttons  ?
                    <button className="btn btn-secondary" style={{'margin-right': '5px'}}
                            onClick={(e) => this.handleSvgClick()}>
                        SVG
                    </button>:
                    <a></a>
                }
                {showbuttons ?
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

class App extends React.Component {
    constructor () {
        super()
        this.state = {
            'geneBoxid': 'geneBox1', 'radarId': '#RadarChart',
            'datasets': [], 'cells': [],
            'selectedDataset': '', 'inputGenes': [],
            'SubmitButtonDisabled': false, 'doOverlay': true,
            'radarData': [], 'genes': [], 'uidCounter': 0,
            'displayOrder': [], 'hiddenStatus': {},
            'colors' : {}, 'availColors' : [...Array(10).keys()].map(i => parseInt(i)),
            'inputId': 'InputStoreEntry', 
            'geneBoxHeight': null, 'geneBoxWidth': null,
            'radarMargins': null, 'radarWidth': null,
            'svg': null, 'groups': {}, 
            'pallete' : [
                d3.rgb(76, 120, 168), d3.rgb(245, 133, 24),
                d3.rgb(228, 87, 86), d3.rgb(114, 183, 178),
                d3.rgb(84, 162, 75), d3.rgb(238, 202, 59),
                d3.rgb(178, 121, 162), d3.rgb(255, 157, 166),
                d3.rgb(157, 117, 93), d3.rgb(186, 176, 172)]
        }
        this.makeDimensions()
        this.fetchDatasets()
        const retval = initializeSvg(this.state.radarId, this.state.radarWidth, this.state.radarMargins)
        this.state.svg = retval[0]
        this.state.groups.mainG = retval[1]
        this.state.groups.hideCloseG = retval[2]
        this.state.groups.legendG = retval[3]
    }
    makeDimensions () {
        const input_store = document.querySelector('#InputStoreEntry').getBoundingClientRect()
        this.state.geneBoxHeight = window.innerHeight*0.85 - input_store.bottom + 'px'
        this.state.geneBoxWidth = input_store.clientWidth + 'px'

        const radar_bb = document.querySelector(this.state.radarId).getBoundingClientRect()
        const radar_bb_width = radar_bb.right - radar_bb.left
        const radar_height =  Math.min((window.innerHeight*0.85 - 
            document.getElementById('SubmitButtonComp').clientHeight), radar_bb_width*0.7)
        this.state.radarWidth = 0.7*radar_height
        this.state.radarMargins = {
            'top': radar_height*0.1, 'bottom': radar_height*0.1, 
            'left': radar_height*0.15,
            'right': radar_height*0.15 + Math.min(radar_bb_width-radar_height, this.state.radarWidth/2), 
        }
    }
    fetchDatasets () {
        console.log('Fetching Datasets')
        fetch('/cellradar/getdatasets')
            .then(response => response.json())
            .then(r => {
                this.state.selectedDataset = r.datasets[0].value
                this.fetchCellsAndPlotAxis()
                this.setState({'datasets': r.datasets})
            })
    }
    handleInputUpdate (v, s) {
        this.state[s] = v
        if (s == 'selectedDataset') {
            this.fetchCellsAndPlotAxis()
        }
    }
    fetchCellsAndPlotAxis () {
        console.log('Fetching Cells')
        const req_data = {
            method: "POST",
            headers: {"Content-Type": "application/json; charset=utf-8"},
            body: JSON.stringify({'dataset': this.state.selectedDataset})
        }
        fetch('/cellradar/getcells', req_data)
            .then(response => response.json())
            .then(r => {
                if (r['msg'] == 'OK') {
                    this.state.cells = r.cells
                    plotAxis(this.state.groups.mainG, this.state.cells,
                        this.state.radarWidth)
                    this.state.radarData = []
                }
                else { alert (r.msg) }
            })
    }
    fetchRadarData (gene_list) {
        console.log('Fetching radarData')
        this.setState({'SubmitButtonDisabled': true})
        const req_data = {
            method: "POST",
            headers: {"Content-Type": "application/json; charset=utf-8"},
            body: JSON.stringify({
                'dataset': this.state.selectedDataset,
                'genes': gene_list})        
        }
        fetch('/cellradar/makeradar', req_data)
            .then(response => response.json())
            .then(r => {
                if (r.msg == 'OK') {
                    document.getElementById(this.state.geneBoxid).value = r.genes
                    this.state.genes.push(r.genes)
                    this.state.radarData.push(r.values[0])
                    this.state.uidCounter += 1
                    this.state.displayOrder.push(this.state.uidCounter)
                    this.state.hiddenStatus[this.state.uidCounter] = false
                    this.state.colors[this.state.uidCounter] = this.state.pallete[this.state.availColors.shift()]
                    console.log(this.state)
                    plotRadar(
                        this.state.groups.mainG, this.state.uidCounter,  r.values[0],
                        this.state.colors[this.state.uidCounter],
                        this.state.cells.length, this.state.radarWidth,
                        (event,uid) => coordinateHighlight(
                            uid, event, this.state.hiddenStatus, this.state.displayOrder)
                    )
                    makeHideToggle (
                        this.state.groups.hideCloseG, this.state.uidCounter,
                        this.state.displayOrder.length*20,
                        (i) => {
                            this.state.hiddenStatus[i] = !this.state.hiddenStatus[i]
                            coordinateVisibility(i)
                        }
                    )
                    makeCloseButton (
                        this.state.groups.hideCloseG, this.state.uidCounter,
                        this.state.displayOrder.length*20,
                        (i) => {}
                    )
                    
                }
                else { alert (r.msg) }
                this.setState({'SubmitButtonDisabled': false})
        })
    }
    render () {
        ReactDOM.render(
            <SubmitButton isDisabled={this.state.SubmitButtonDisabled}
                          callBackFunc={() => this.fetchRadarData(this.state.inputGenes)} />,
            document.getElementById("SubmitButtonComp"))
        
        ReactDOM.render(
            <DatasetSelect datasets={this.state.datasets}
                fontsize={'16px'}
                callBackFunc={v => this.handleInputUpdate(v, 'selectedDataset')} />,
            document.getElementById("DatasetSelectComp"))
        
        ReactDOM.render(
            <GeneBox id={this.state.geneBoxid}
                    height={this.state.geneBoxHeight} width={this.state.geneBoxWidth}
                    callBackFunc={v => this.handleInputUpdate(v, 'inputGenes')} />,
            document.getElementById("GeneBoxComp"))
        
        ReactDOM.render(
            <AppendCheckBox
                callBackFunc={(v) => this.handleInputUpdate(v, 'doOverlay')}/>,
            document.getElementById("AppendCheckBoxComp"))
        
        return null
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("AppEntryPoint")
)
