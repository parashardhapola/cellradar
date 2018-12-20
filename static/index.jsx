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
                onChange={e => this.props.callBackFunc(e.target.value)}>
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
        console.log(
            this.props.width, this.props.height
        )
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
            // let x = d3.select('.sideInfoWrapper')[0][0].children
            // Array.from(x).forEach(function (i) {i.remove()})
            const svgString = 'data:image/svg+xml;base64,' +  btoa(
                new XMLSerializer().serializeToString(document.querySelector('svg')))
            // this.props.displayedData.forEach(i => {
            //     this.props.plotSideInfo(i)
            // })
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
                          this.props.radarMargins.left+
                          this.props.radarMargins.right)
        canvas.height = 3*(this.props.radarWidth+
                           this.props.radarMargins.top+
                           this.props.radarMargins.bottom)
        const ctx = canvas.getContext('2d')
        ctx.scale(3,3)
        const img = new Image()
        img.src = this.makeSvg()
        img.onload = () => {
            ctx.drawImage(img, 0, 0)
            this.handleDownload(canvas.toDataURL(), 'png')
        }
    }
    handleSvgClick () {
        this.handleDownload(this.makeSvg(), 'svg')
    }
    render () {
        console.log ('Rendering SvgDownload')
        return (
            <div>
                <button className="btn btn-secondary" style={{'margin-right': '5px'}}
                        onClick={(e) => this.handleSvgClick()}>
                    SVG
                </button>
                <button className="btn btn-secondary"
                        onClick={(e) => this.handlePngClick()}>
                    PNG
                </button>
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
            'genes': {}, 'uidCounter': 0,
            'displayedData': [], 'displayInfo': {},
            'availColors' : null,
            'inputId': 'InputStoreEntry', 
            'geneBoxHeight': null, 'geneBoxWidth': null,
            'radarMargins': null, 'radarWidth': null,
            'pallete' : [
                d3.rgb(76, 120, 168), d3.rgb(245, 133, 24),
                d3.rgb(228, 87, 86), d3.rgb(114, 183, 178),
                d3.rgb(84, 162, 75), d3.rgb(238, 202, 59),
                d3.rgb(178, 121, 162), d3.rgb(255, 157, 166),
                d3.rgb(157, 117, 93), d3.rgb(186, 176, 172)]
        }
        this.makeDimensions()
        this.fetchDatasets()
        initializeSvg(this.state.radarId,
            this.state.radarWidth, this.state.radarMargins)
        this.state.availColors = this.state.pallete
    }
    makeDimensions () {
        console.log('Making dimensions')
        console.log(document.querySelector('#InputStoreEntry').offsetWidth)
        const input_store = document.querySelector('#InputStoreEntry').getBoundingClientRect()
        this.state.geneBoxHeight = window.innerHeight*0.85 - input_store.bottom + 'px'
        this.state.geneBoxWidth = input_store.offsetWidth + 'px'

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
                this.setState({'datasets': r.datasets})
                this.handleInputUpdate('selectedDataset', r.datasets[0].value)               
            })
    }
    handleInputUpdate (s, v) {
        console.log('Updating ' + s)
        this.state[s] = v
        if (s == 'selectedDataset') {
            this.handleDatasetChange()
        }
    }
    handleDatasetChange() {
        console.log('Responding to updated dataset')
        const req_data = {
            method: "POST",
            headers: {"Content-Type": "application/json; charset=utf-8"},
            body: JSON.stringify({'dataset': this.state.selectedDataset})
        }
        fetch('/cellradar/getcells', req_data)
            .then(response => response.json())
            .then(r => {
                if (r['msg'] == 'OK') {
                    console.log('Cells fetched, resetting the axis')
                    this.state.cells = r.cells
                    removeBlocks(['axisWrapper', 'plotWrapper'])
                    plotAxis(this.state.cells, this.state.radarWidth)
                    if (this.state.doOverlay) {
                        console.log('Will rerender the plot with for new dataset')
                        this.state.displayedData.forEach(uid => {
                            this.fetchRadarData(null, uid)
                        })
                    }
                    else {
                        removeBlocks(['sideInfoWrapper'])
                    }                   
                }
                else { alert (r.msg) }
            })
    }
    fetchCells () {
        
    }
    fetchRadarData (gene_list, uid) {
        if (this.state.displayedData.length == 10) {
            alert ('Only upto 10 datatsets can be loaded at a time!')
            return false
        }
        if (this.state.doOverlay == false) {
            console.log('Not overlaying, resetting the data')
            removeBlocks(['plotWrapper', 'sideInfoWrapper'])
            this.setState({
                'genes': {}, 'uidCounter': 0,
                'displayedData': [], 'displayInfo': {},
                'availColors' : this.state.pallete,    
            })
        }
        if (gene_list == null) {
            if (uid == null) {
                console.log('ERROR :Null params in fetchRadarData')
                return false
            }
            else {
                console.log('Got saved raw gene list')
                gene_list = this.state.genes[uid].raw
            }
            const rollback_active = false
        }
        else {
            console.log('New genelist obtained. Updating state data')
            this.state.uidCounter += 1
            uid = this.state.uidCounter
            this.state.genes[this.state.uidCounter] = {
                'raw': gene_list, 'filtered': {}
            }
            this.state.displayInfo[this.state.uidCounter] = {
                'color' : this.state.availColors.shift(),
                'hidden': false,
                'label': 'List ' + this.state.uidCounter
            }
            this.state.displayedData.push(uid)
            const rollback_active = true
        }
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
                    this.state.genes[uid].filtered[this.state.selectedDataset] = r.genes
                    this.plotRadarData(r.values[0], uid)
                    this.plotSideInfo(uid)
                }
                else {
                    alert (r.msg)
                    if (rollback_active) {
                        this.state.displayedData.pop()
                    }
                }
                this.setState({'SubmitButtonDisabled': false})
        })
    }
    plotRadarData (data, uid) {
        console.log('Plotting Radar area for UID: ' + uid)
        plotRadar(
            uid, data,
            this.state.displayInfo[uid].color,
            this.state.cells.length, this.state.radarWidth,
            (i, e) => coordinateHighlight(
                i, e, this.state.displayInfo, this.state.displayedData)
        )
        toggleVisibility(uid)
    }
    plotSideInfo (uid) {
        console.log('Plotting Side info for UID: ' + uid)
        const ypos = this.state.displayedData.indexOf(uid)*this.state.radarWidth/10
        makeSideGroup(uid)
        makeCloseButton (
            uid, ypos, (i, e) => toggleCloseBtn(i, e),
            i => {
                this.state.availColors.push(this.state.displayInfo[uid].color)
                this.state.displayedData = this.state.displayedData
                    .filter((x) => {return x!=i})
                removePlot(i)
                removeBlocks(['sideInfoWrapper'])
                this.state.displayedData.forEach(i => {
                    this.plotSideInfo(i)
                })
            }
        )
        makeHideToggle (
            uid, ypos,this.state.displayInfo[uid].hidden,
            (i) => {
                this.state.displayInfo[uid].hidden = 
                    !this.state.displayInfo[uid].hidden
                toggleVisibility(i)
            }
        )
        makeLegend(
            uid, ypos, 50, this.state.radarWidth/35,
            this.state.displayInfo[uid].label, this.state.displayInfo[uid].color,
            (i, e) => coordinateHighlight(
                i, e, this.state.displayInfo, this.state.displayedData),
            (text) => {
                this.state.displayInfo[uid].label = text
            }
        )
    }
    render () {
        ReactDOM.render(
            <SubmitButton isDisabled={this.state.SubmitButtonDisabled}
                          callBackFunc={() => this.fetchRadarData(this.state.inputGenes, null)} />,
            document.getElementById("SubmitButtonComp"))
        
        ReactDOM.render(
            <DatasetSelect datasets={this.state.datasets}
                fontsize={'16px'}
                callBackFunc={v => this.handleInputUpdate('selectedDataset', v)} />,
            document.getElementById("DatasetSelectComp"))
        
        ReactDOM.render(
            <GeneBox id={this.state.geneBoxid}
                    height={this.state.geneBoxHeight} width={this.state.geneBoxWidth}
                    callBackFunc={v => this.handleInputUpdate('inputGenes', v)} />,
            document.getElementById("GeneBoxComp"))
        
        ReactDOM.render(
            <AppendCheckBox
                callBackFunc={(v) => this.handleInputUpdate('doOverlay', v)}/>,
            document.getElementById("AppendCheckBoxComp"))

        ReactDOM.render(
            <SvgDownload radarWidth={this.state.radarWidth}
                radarMargins={this.state.radarMargins} />,
            document.getElementById("SvgDownloadComp"))
        
        return null
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("AppEntryPoint")
)
