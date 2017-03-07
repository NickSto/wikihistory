#!/usr/bin/env python3
from flask import Flask, jsonify
from collections import Counter
import sys
import wikiedits

app = Flask(__name__)

@app.route('/static/<path:path>')
def serve_static(path):
  return send_from_directory('static', path)


@app.route('/edits/<username>')
def get_edits(username):
  edits = list(wikiedits.get_edits(username, time_limit=365))
  return jsonify(edits)


@app.route('/day_edits/<username>/<date>')
def get_edits_for_day(username, date):
  edits = list(wikiedits.get_edits_for_day(username, date))
  return jsonify(edits)


@app.route('/edits_per_day/<username>')
def get_edits_per_day(username):
  date_counts = {}
  for date, count in wikiedits.get_edits_per_day(username, time_limit=365):
    date_counts[date] = count
  return jsonify(date_counts)

if __name__ == '__main__':
  if len(sys.argv) > 1 and sys.argv[1].lower().startswith('dev'):
    app.debug = True
    app.run(host='127.0.0.1', port=5000)
  else:
    app.debug = False
    app.run(host='0.0.0.0', port=80)
