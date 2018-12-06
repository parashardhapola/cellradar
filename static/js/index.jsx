class GeneBox extends React.Component {
	render () {
		return ()
	}
}

class SvgDisplay extends React.Component {
	render () {
		return ()
	}
}

class SvgCustomize extends React.Component {
	render () {
		return ()
	}
}

class DatasetSelect extends React.Component {
	render () {
		return ()
	}
}









class GeneBox extends React.Component {
	constructor () {
		super()
		this.updateGeneList	= this.updateGeneList.bind(this)
		this.updateLineColor = this.updateLineColor.bind(this)
		this.updateFillColor = this.updateFillColor.bind(this)
		this.updateFontSize = this.updateFontSize.bind(this)
		this.state = {
			svgData: '', mpl_colors: {},
			disableSubmitButton: false, showDownloadLink: false,
			fontSize: 14, fillColor: 'crimson', lineColor: 'crimson',
			 
		};
	}

	componentDidMount (){
		document.getElementById(this.props.uid).value = 'MPO\nELANE\nFLT3\nEGFL7';
		this.updateGeneList()
		fetch('/cellradar/mpl_colors')
			.then(response => response.json())
			.then(r => {
				this.state['mpl_colors'] = r['mpl_colors'];
				this.setState(this.state);
			})
	}

	componentDidUpdate () {
		document.getElementById(this.props.svguid).innerHTML = this.state.svgData;

		if (this.state.showDownloadLink) {
			var textToSaveAsBlob = new Blob([this.state.svgData],
											{type:"text/plain"});
	    	document.getElementById(this.props.downloaduid).href = 
	    		window.URL.createObjectURL(textToSaveAsBlob);
		}
	}

	updateLineColor (e) {
		this.state.lineColor = e.target.value;
		this.updateGeneList()
	}

	updateFillColor (e) {
		this.state.fillColor = e.target.value;
		this.updateGeneList()
	}

	updateFontSize (e) {
		this.state.fontSize = e.target.value;
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
				'dataset': this.props.dataset,
				'fillColor': this.state.fillColor,
				'lineColor': this.state.lineColor,
				'fontSize': this.state.fontSize
			})		
		}
		this.state.disableSubmitButton = true;
		this.state.svgData = '';
		this.state.showDownloadLink = false;
		this.setState(this.state);

		fetch('/cellradar/makeradar', req_data)
		.then(response => response.json()).then(res => {
			var showDownloadLink = true
			if (res['svg'].length < 100) {
				showDownloadLink = false
			}
			document.getElementById(this.props.uid).value = res['valid_genes'];
			this.state.disableSubmitButton = false;
			this.state.svgData = res['svg'];
			this.state.showDownloadLink = showDownloadLink;
			this.setState(this.state);
		})
	}

	render () {

		var color_options = [];
		for (var i in this.state.mpl_colors) {
			color_options.push(<option style={{'background-color': this.state.mpl_colors[i]}}
								       value={i}>{i}</option>)
		}

		return (
			<div>

				<div className="row">
					<div className="col-4">
						<br />
						<p>
							<b>Paste gene symbols below</b><br />
						  	<small>(One gene per line)</small>
						</p>
						<textarea rows="20" cols="20" id={this.props.uid} />
						<br />
						{this.state.disableSubmitButton ? 
							<button className="btn" disabled>Wait</button>:
							<button className="btn"
								    onClick={this.updateGeneList}>Submit</button>
						}
						<br />
						<small>Invalid gene names will be removed</small>
						<br />
					</div>
					
					<div className="col-8">
						<br />
						<div id={this.props.svguid}></div>
						{this.state.showDownloadLink ? 
							<a id={this.props.downloaduid} href=''
							   download='CellRadar.svg'>Download SVG</a>:
							<p></p>
						}				
					</div>

	    		</div>

	    		<div className="row">
	    			<div className="col-4"></div>
	    			<div className="col-8">
		    			<div className="row">
							<div className="col-3">Fill color</div>
							<div className="col-9">
								{this.state.disableSubmitButton ?
									<select onInput={this.updateFillColor} disabled>
										{color_options}
									</select>:
									<select onInput={this.updateFillColor}>
										{color_options}
									</select>
								}
							</div>
						</div>
						<div className="row">
							<div className="col-3">Line color</div>
							<div className="col-9">
								{this.state.disableSubmitButton ?
									<select disabled>
										{color_options}
									</select>:
									<select onInput={this.updateLineColor}>
										{color_options}
									</select>
								}
							</div>
						</div>
						<div className="row">
							<div className="col-3">Font size</div>
							<div className="col-9">
								{this.state.disableSubmitButton ?
									<input type="range" min="4" max="36" step="2"
										   value={this.state.fontSize} disabled/>
									:
									<input type="range" min="4" max="36" step="2"
										   value={this.state.fontSize}
										   onChange={this.updateFontSize}/>
								}
							</div>
						</div>
					</div>
				</div>
			
			</div>
		)
	}
}


class App extends React.Component {
	constructor () {
		super()
		this.updateDataset	= this.updateDataset.bind(this)
		this.state = {dataset: 'mouse_normal_bloodspot'};
	}

	updateDataset (e) {
		this.setState({dataset: e.target.value});
	}

	render () {
		return (
			<div className="container">
				<br />

				<div className="row">
					<div className="col-1"></div>

					<div className="col-10">
						<h1>Welcome to CellRadar</h1>
						
						<div className="row">
							<div className="col-3">
								<br />
								<p>Select dataset:</p>
							</div>
							<div className="col-9">
								<br />
								<select onInput={this.updateDataset}>
						 			<option value="mouse_normal_bloodspot">
						 				Mouse normal hematopoiesis</option>
						 			<option value="human">Human</option>
								</select>
							</div>
						</div>

						<GeneBox downloaduid='downsvg' svguid='svgimage' uid='genetext'
								 dataset={this.state.dataset} />
					</div>

					<div className="col-1"></div>
				</div>
			</div>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById("jsxroot")
);
