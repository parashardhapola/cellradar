class GeneBox extends React.Component {
	constructor () {
		super()
		this.updateGeneList	= this.updateGeneList.bind(this)
		this.state = {disableButton: false, svgData: '', showDownload: false};
	}

	componentDidMount (){
		document.getElementById(this.props.uid).value = 'MPO\nELANE\nFLT3\nEGFL7';
		this.updateGeneList()
	}

	updateGeneList () {
		const geneList = document.getElementById(this.props.uid)
						.value.split("\n").filter(g => g.length > 0);
		const req_data = {
			method: "POST",
			headers: {
            	"Content-Type": "application/json; charset=utf-8",
        	},
			body: JSON.stringify({
				'genes': geneList,
				'organism': this.props.organism
			})		
		}
		this.setState({disableButton: true, svgData: '', showDownload: false})
		fetch('/cellradar/makeradar', req_data)
		.then(response => response.json()).then(res => {
			console.log(res)
			var showDownload = true
			if (res['svg'].length < 100) {
				showDownload = false
			}
			document.getElementById(this.props.uid).value = res['valid_genes'];
			this.setState({disableButton: false, svgData: res['svg'],
						   showDownload: showDownload})
		})
	}

	componentDidUpdate () {
		document.getElementById(this.props.svguid).innerHTML = this.state.svgData;

		if (this.state.showDownload) {
			var textToSaveAsBlob = new Blob([this.state.svgData],
											{type:"text/plain"});
	    	document.getElementById(this.props.downloaduid).href = 
	    		window.URL.createObjectURL(textToSaveAsBlob);
		}
	}

	render () {
		return (
			<div className="row">
					
				<div className="col-4">
					<br />
					<p>
						<b>Paste gene symbols below</b><br />
					  	<small>(One gene per line)</small>
					</p>
										
					<textarea rows="20" cols="20" id={this.props.uid} />
					<br />
					{this.state.disableButton ? 
						<button className="btn" disabled>Wait</button>:
						<button className="btn"
							    onClick={this.updateGeneList}>Submit</button>
					}
					<br />
					<small>Invalid gene names will be removed</small>
				</div>
				
				<div className="col-8">
					<br />
					<div id={this.props.svguid}></div>
					{this.state.showDownload ? 
						<a id={this.props.downloaduid} href=''
						   download='CellRadar.svg'>Download SVG</a>:
						<p></p>
					}
				</div>

    		</div>
		)
	}
}


class App extends React.Component {
	constructor () {
		super()
		this.updateOrganism	= this.updateOrganism.bind(this)
		this.state = {organism: 'mouse_normal_bloodspot'};
	}

	updateOrganism (e) {
		this.setState({organism: e.target.value});
	}

	render () {
		return (
			<div className="container">
				<br />
				<h1>Welcome to CellRadar</h1>
				
				<div className="row">
					<div className="col-2">
						<br />
						<p>Select dataset:</p>
					</div>
					<div className="col-3">
						<br />
						<select onInput={this.updateOrganism}>
						 	<option value="mouse_normal_bloodspot">Mouse normal hematopoiesis</option>
						 	<option value="human">Human</option>
						</select>
					</div>
				</div>

				<GeneBox downloaduid='downsvg' svguid='svgimage' uid='genetext'
						 organism={this.state.organism} />
			</div>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById("jsxroot")
);
