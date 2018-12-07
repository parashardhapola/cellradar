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
				<b>Select dataset: </b>
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
				<p>
					<b>Paste gene symbols below</b><br />
			  		<small>(One gene per line)</small>
				</p>
				<textarea rows="10" cols="30" id={this.props.uid} 
						  onInput={e => this.onTextUpdate(e.target.value)} />
				<br />
				<small><i>Invalid gene names will be removed</i></small>
				<br />
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

class App extends React.Component {
	constructor () {
		super()
		this.state = {
			'geneBoxid': 'geneBox1', 'selectedDataset': '', 'inputGenes': [],
			'SubmitButtonDisabled': false, 'radarData': {}
		}
	}
	fetchRadarData () {
		console.log('Fetching radarData')
		this.setState({'SubmitButtonDisabled': true})
		const req_data = {
			method: "POST",
			headers: {
            	"Content-Type": "application/json; charset=utf-8",
        	},
			body: JSON.stringify({
				'dataset': this.state.selectedDataset,
			  	'genes': this.state.inputGenes
			})		
		}
		fetch('/cellradar/makeradar', req_data)
			.then(response => response.json())
			.then(r => {
				this.setState({'SubmitButtonDisabled': false, 'radarData': r})
				document.getElementById(this.state.geneBoxid).value = r['genes']
				console.log(this.state)
                this.makeradar()
			})
	}
    makeradar = () => {
        console.log ('Rendering RadarD3')
        var data = []
        for (var i in this.state.radarData.cells) {
            data.push({'axis': this.state.radarData.cells[i],
                       'value': this.state.radarData.ylist[0][i]})
        }

        var margin = {top: 60, right: 60, bottom: 60, left: 60}
        var width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right
        var height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20)
        var width = 350
        var height = 350
        var color = d3.scale.ordinal()
            .range(["#EDC951"]);
            
        var radarChartOptions = {
          w: width,
          h: height,
          margin: margin,
          maxValue: 0.5,
          levels: 5,
          roundStrokes: true,
          color: color
        };
        RadarChart(".radarChart", [data], radarChartOptions);
    }   

	render () {
		console.log('Rendering App')
		return (
			<div className="container">
				<br />
				<h2>Welcome to CellRadar</h2>
				<br />
				<div className='row'>
					<div className='col-4'>
						<InputStore uid={this.state.geneBoxid}
							callBackFunc={(v, s) => {this.state[s] = v}} />
						<SubmitButton isDisabled={this.state.SubmitButtonDisabled}
							callBackFunc={() => this.fetchRadarData()} />
					</div>
					<div className='col-6'>
                        <div className='radarChart'>
                        </div>
					</div>
				</div>
				<br />
			</div>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById("jsxroot")
);
