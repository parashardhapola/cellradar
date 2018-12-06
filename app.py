from flask import Flask, render_template, request, jsonify
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO
from matplotlib import colors as mcolors
import h5py
import re

named_colors = {k.capitalize():v for k,v in
                dict(mcolors.BASE_COLORS, **mcolors.CSS4_COLORS).items() if len(k) > 1}

def make_fig(dataset, genes, figsize=(6, 6), fs=14, display_std=True,
             lw=1, lc='crimson', fc='crimson'):
    
    def read_data(fn, genes):
        a = h5py.File(fn, mode='r', swmr=True)
        data_mean = [np.array([x.decode('UTF-8') for x in a['data']['celltypes'][:]])]
        data_std = [data_mean[0]]
        index = ['cells']
        for i in genes:
            try:
                x = a['data'][i][:]
            except KeyError:
                continue
            else:
                data_mean.append(x[0])
                data_std.append(x[1])
                index.append(i)
        return (pd.DataFrame(data_mean, index=index).T.set_index('cells'),
                pd.DataFrame(data_std, index=index).T.set_index('cells'))

    def normalize(a):
        a = a-a.min()
        a = a/a.max()
        return list(a) + [a[0]]

    def plot_vals(ax, mean, std, show_std, line_color, fill_color, line_width):
        y1 = normalize(mean.median(axis=1))
        y2 = normalize((mean - std).median(axis=1))
        y3 = normalize((mean + std).median(axis=1))
        pos = np.radians(np.linspace(0, 360, len(mean)+1, endpoint=True))
        if show_std:
            for i in [y1, y2, y3]:
                ax.plot(pos, i, lw=line_width, c=line_color)
                ax.fill_between(pos, 0, i, alpha=0.3, color=fill_color)
        else:
            ax.plot(pos, y1, lw=line_width, c=line_color)
            ax.fill_between(pos, 0, y1, alpha=0.3, color=fill_color)
        ax.set_xticks(pos)

    def make_labels(ax, labels, label_size):
        coords = np.radians(np.linspace(0, 360, len(labels)+1, endpoint=True))[:-1]
        for coord, label in zip(coords, labels):
            d = np.rad2deg(coord)
            if d < 90 or d > 270:
                rotation = d
            else:
                rotation = 180 + d
            ax.text(coord, 1.3, label.replace('_', '\n'), rotation=rotation,
                        va='center', ha='center', fontsize=label_size, zorder=0)

    def make_svg(figure):
        imgdata = StringIO()
        fig.savefig(imgdata, format='svg')
        imgdata.seek(0)
        retval = imgdata.read()
        imgdata.close()
        return retval

    def clean_axis(ax):
        ax.grid(which='major', linestyle='--', alpha=0.4)
        ax.set_facecolor('white')
        ax.figure.patch.set_facecolor('white')
        ax.set_yticks([])
        ax.set_xticklabels([''])
        ax.set_yticklabels([''])
        ax.spines["polar"].set_visible(False)
        ax.figure.patch.set_alpha(0)
        ax.patch.set_alpha(0)
        ax.set_ylim((0, 1.5))
    
    fig = plt.figure(figsize=figsize)
    ax = fig.add_subplot(111, polar=True)
    mean, std = read_data()
    if len(mean.columns) == 0:
        return '', []
    plot_vals(ax, mean, std, display_std, lc, fc, lw)
    make_labels(ax, list(mean.index), fs)
    clean_axis(ax)
    plt.tight_layout()
    retval = make_svg(fig)
    fig.clear()
    plt.close()
    return retval, list(mean.columns)

DATAFILES = {
    'Mouse normal hematopoiesis (BloodSpot)': 'datasets/mouse_normal_hematopoiesis_bloodspot.h5',
    'Human normal hematopoiesis (HemaExplorer)': 'datasets/human_hemaexplorer.h5'
}

app = Flask(__name__)

if __name__ == "__main__":
    url_prefix = '/cellradar'
else:
    url_prefix = '/'

@app.route("%s" % url_prefix)
def index():
    return render_template('index.html',
     randstr='?rand%d' % np.random.randint(100000000000000))

@app.route("%s/getdatasets" % url_prefix, methods=['GET'])
def get_datasets():
    return jsonify({
        'datasets': list(DATAFILES.keys()),
    })

@app.route("%s/makeradar" % url_prefix, methods=['POST'])
def make_radar():
    data = request.get_json()
    genes = [re.sub('[^0-9a-zA-Z]+', '', x).upper() for x in data['genes']]
    if data['dataset'] not in DATAFILES:
        return jsonify({
            'valid_genes': '\n'.join(genes),
            'svg': '%s not present in the database' % data['dataset']
        })
    else:
        svg, valid_genes = make_fig(
            data['dataset'], genes, figsize=(6, 6), display_std=True,
            lw=1, fs=int(data['fontSize']),
            lc=data['lineColor'].lower(), fc=data['fillColor'].lower())
        if len(valid_genes) == 0:
            return jsonify({
                'valid_genes': '',
                'svg': 'Atleast one valid gene required'
            })
        else:
            return jsonify({
                'valid_genes': '\n'.join(valid_genes),
                'svg': svg
            })

@app.route("/mpl_colors", methods=['GET'])
def mpl_colors():
    return jsonify({
        'mpl_colors': named_colors
    })

if __name__ == "__main__":
    app.run()