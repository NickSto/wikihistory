from flask import Flask, jsonify
from collections import Counter
import graph

app = Flask(__name__)

@app.route('/edits/<username>')
def get_edits(username):
    data = graph.get_edits(username);
    data = [d['timestamp'].split('T')[0] for d in data]
    counts = Counter(data)
    json = jsonify(counts)
    return json
