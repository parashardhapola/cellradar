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

    blank_return = {'xvals': [], 'ylist': [], 'genes': [], 'cells': []}

    if len(genes) == 0:
        return {**blank_return, **{'msg':
         'Please enter atleast one gene name'}}
    if dataset not in DATAFILES:
        return {**blank_return, **{'msg':
         'Selected datatset is invalid'}}
    genes = [re.sub('[^0-9a-zA-Z]+-', '', x).upper() for x in genes]
    
    h5fn = h5py.File(DATAFILES[dataset], mode='r', swmr=True)
    data_mean = [np.array([x.decode('UTF-8') for x
                 in h5fn['data']['celltypes'][:]])]
    data_std = [data_mean[0]]
    index = {'cells': None}
    for i in genes:
        if i in index:
            continue
        try:
            x = h5fn['data'][i][:]
        except KeyError:
            continue
        else:
            data_mean.append(x[0])
            data_std.append(x[1])
            index[i] = None
    h5fn.close()
    index = list(index.keys())
    if len(index) == 1:
        return {**blank_return, **{'msg':
         'None of the entered gene names is valid'}}
    mean = pd.DataFrame(data_mean, index=index).T.set_index('cells')
    std = pd.DataFrame(data_std, index=index).T.set_index('cells')
    y1 = normalize(mean.median(axis=1))
    y2 = normalize((mean - std).median(axis=1))
    y3 = normalize((mean + std).median(axis=1))
    x = list(np.radians(np.linspace(0, 360, len(mean)+1, endpoint=True)))
    return {
        'xvals': x, 'ylist': [y1, y2, y3],
        'genes': '\n'.join(list(mean.columns)), 'cells': list(mean.index),
        'msg': 'OK'
    }

DATAFILES = {
    'Mouse normal hematopoiesis (BloodSpot)': 'datasets/mouse_normal_hematopoiesis_bloodspot.h5',
    'Human normal hematopoiesis (HemaExplorer)': 'datasets/human_hemaexplorer.h5'
}

app = Flask(__name__)

if __name__ == "__main__":
    url_prefix = '/cellradar'
else:
    url_prefix = ''

@app.route("%s/" % url_prefix)
def index():
    return render_template('index.html',
     randstr='?rand%d' % np.random.randint(1e8))

@app.route("%s/getdatasets" % url_prefix, methods=['GET'])
def get_datasets():
    return jsonify({
        'datasets': [{'id': 'dataset%d' % n, 'value': x } for n,x in
                     enumerate(DATAFILES.keys(), 1)],
    })

@app.route("%s/makeradar" % url_prefix, methods=['POST'])
def make_radar():
    data = request.get_json()
    return jsonify(prep_data(data['dataset'], data['genes']))

if __name__ == "__main__":
    app.run(debug=True, port=10751)