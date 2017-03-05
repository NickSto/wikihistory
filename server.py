from flask import Flask, jsonify
from collections import Counter
import graph

app = Flask(__name__)

@app.route('/static/<path:path>')
def serve_static(path):
  return send_from_directory('static', path)


@app.route('/edits/<username>')
def get_edits(username):
  edits = list(graph.get_edits(username, time_limit=365))
  return jsonify(edits)


@app.route('/edits_per_day/<username>')
def get_edits_per_day(username):
  date_counts = {}
  for date, count in graph.get_edits_per_day(username, time_limit=365):
    date_counts[date] = count
  return jsonify(date_counts)
