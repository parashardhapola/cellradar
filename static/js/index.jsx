class DatasetSelect extends React.Component {
	constructor () {
		super()
		this.state = {'datasets': []}
	}
	componentWillMount () {
		console.log('fetching datatset')
		fetch('/cellradar/getdatasets')
			.then(response => response.json())
			.then(r => {
				this.setState({'datasets': r['datasets']})
				this.props.callBackFunc(r['datasets'][0]['value'])
			})
	}
	render () {
		console.log('Rendering DatasetSelect')
		return (
			<div>
				<small><b>Select dataset: </b></small>
				<select style={{'width':'250px', 'font-size':'12px'}}
					onInput={e => this.props.callBackFunc(e.target.value)}>
					{this.state.datasets.map(item => (
						<option key={item.id}>{item.value}</option>
					))}
				</select>
			</div>
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
			<div>
				<small><b>Paste gene symbols</b></small>
                <p><small>(One gene per line)</small></p>
			  	<textarea rows="8" id={this.props.uid} 
                          style={{'width':'150px'}}
						  onInput={e => this.onTextUpdate(e.target.value)} />
				<p><small><i>Invalid gene names will be removed</i></small></p>
			</div>
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
            <div>
                <input type="checkbox"
                    onInput={(e) => this.handleClick()}
                    style={{'vertical-align':'middle'}}/>
                <small style={{'vertical-align':'middle'}}>
                    Overlay over existing data
                </small>
            </div>
        )   
    }
}

class InputStore extends React.Component {
	shouldComponentUpdate() {
		return false
	}
	render () {
		console.log('Rendering InputStore')
		return (
			<div>
				<DatasetSelect
					callBackFunc={v => this.props.callBackFunc(v, 'selectedDataset')} />
				<br />
				<GeneBox uid={this.props.uid}
					callBackFunc={v => this.props.callBackFunc(v, 'inputGenes')} />
                <AppendCheckBox callBackFunc={(v) => this.props.callBackFunc(v, 'doOverlay')}/>
                <br />
			</div>
		)
	}
}

class SubmitButton extends React.Component {
	render() {
		console.log('Rendering SubmitButton')
		return (
			<div>
				{this.props.isDisabled ?
					<button className="btn" disabled>Wait</button>:
					<button className="btn"
							onClick={this.props.callBackFunc}>Submit</button>
				}
			</div>
		)	
	}
}

const navbarStyle = {
    'border-radius': '10px',
    'background': '#ededed',
    'margin-top': '10px',
    'margin-bottom': '10px',
}

class App extends React.Component {
	constructor () {
		super()
		this.state = {
			'geneBoxid': 'geneBox1', 'selectedDataset': '', 'inputGenes': [],
			'SubmitButtonDisabled': false, 'radarData': [], 'doOverlay': true
		}
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
		fetch('/cellradar/makeradar', req_data)
			.then(response => response.json())
			.then(r => this.handleRadarData(r))
	}
    handleRadarData (r) {
        if (r.msg == 'OK') {
            const data = r.cells.map((i,n) => {return {'axis':i, 'value':r.ylist[0][n]}})
            if (this.state.doOverlay) {
                this.state.radarData.push(data)
            } else {
                this.state.radarData = [data]
            }
            this.makeRadar()
        }
        else {
            console.log(r.msg)
        }
        document.getElementById(this.state.geneBoxid).value = r['genes']
        this.setState({'SubmitButtonDisabled': false})
    }
    makeRadar () {
        console.log ('Rendering RadarD3')
        RadarChart(".radarChart", this.state.radarData, {});
    }
    handleInputUpdate (v, s) {
        this.state[s] = v
        if (s == 'selectedDataset') {
            this.state.radarData = []
        }
        console.log(s, v)
    }
	render () {
		console.log('Rendering App')
		return (
            <div className="container">

                <nav class="navbar navbar-default" style={navbarStyle}>
                    <div class="navbar-header">
                      <a class="navbar-brand">CellRadar</a>
                    </div>
                </nav>

                <div className='row'>
					<div className='col-4'>
						<InputStore uid={this.state.geneBoxid}
							callBackFunc={(v, s) => this.handleInputUpdate(v, s)} />
						<SubmitButton isDisabled={this.state.SubmitButtonDisabled}
							callBackFunc={() => this.fetchRadarData()} />
					</div>
					<div className='col-6'>
                        <div className='radarChart'>
                        </div>
					</div>
				</div>
				<br />
                
                <footer>
                    <div>
                        <p>Stem Cells and Leukemia Lab, Lund University</p>
                    </div>
                </footer>
			</div>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById("jsxroot")
);
