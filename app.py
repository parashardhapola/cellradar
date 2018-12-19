from flask import Flask, render_template, request, jsonify
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO
from matplotlib import colors as mcolors
import h5py
import re

def prep_data(dataset, genes):

    def normalize(a):
        a = a-a.min()
        a = a/a.max()
        return list(a) + [a[0]]

    if len(genes) == 0:
        return {**blank_return, **{'msg':
         'Please enter atleast one gene name'}}
    if dataset not in DATAFILES:
        return {'msg': 'Selected datatset is invalid'}
    genes = [re.sub('[^0-9a-zA-Z]+-', '', x).upper() for x in genes]
    
    h5fn = h5py.File(DATAFILES[dataset], mode='r', swmr=True)
    data_mean = [np.array([x.decode('UTF-8') for x
                 in h5fn['data']['celltypes'][:]])]
    data_std = [data_mean[0]]
    gene_order = []
    lookup = {}
    for i in genes:
        if i in lookup:
            continue
        try:
            values = h5fn['data'][i][:]
        except KeyError:
            continue
        else:
            data_mean.append(values[0])
            data_std.append(values[1])
            lookup[i] = None
            gene_order.append(i)
    h5fn.close()
    if len(gene_order) == 0:
        return {'msg': 'None of the entered gene names is valid'}
    gene_order = ['cells'] + gene_order
    mean = pd.DataFrame(data_mean, index=gene_order).T.set_index('cells')
    std = pd.DataFrame(data_std, index=gene_order).T.set_index('cells')
    y1 = normalize(mean.median(axis=1))
    y2 = normalize((mean - std).median(axis=1))
    y3 = normalize((mean + std).median(axis=1))
    return {
        'values': [y1, y2, y3],
        'genes': '\n'.join(list(mean.columns)),
        'msg': 'OK'
    }

DATAFILES = {
    'Mouse normal hematopoiesis (BloodSpot)': 'datasets/mouse_normal_hematopoiesis_bloodspot.h5',
    'Human normal hematopoiesis (HemaExplorer)': 'datasets/human_hemaexplorer.h5'
}

app = Flask(__name__)

if __name__ == "__main__":
    route = '/cellradar/'
else:
    route = '/'

@app.route("%s" % route)
def index():
    return render_template('index.html',
     randstr='?rand%d' % np.random.randint(1e8))

@app.route("%sgetdatasets" % route, methods=['GET'])
def get_datasets():
	return jsonify({
        'datasets': [{'id': 'dataset%d' % n, 'value': x } for n,x in
                     enumerate(DATAFILES.keys(), 1)],
    })

@app.route("%sgetcells" % route, methods=['POST'])
def get_cells():
	data = request.get_json()
	print (data)
	if 'dataset' in data and data['dataset'] in DATAFILES:
		cells = h5py.File(DATAFILES[data['dataset']], mode='r', swmr=True)['data']['celltypes']
		cells = [x.decode('UTF-8') for x in cells[:]]
		return jsonify({'cells': cells, 'msg': 'OK'})
	else:
		return jsonify({'msg': 'Error fetching cells'})

@app.route("%smakeradar" % route, methods=['POST'])
def make_radar():
    data = request.get_json()
    return jsonify(prep_data(data['dataset'], data['genes']))

if __name__ == "__main__":
    app.run(debug=True, port=10751)
