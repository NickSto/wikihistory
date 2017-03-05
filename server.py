from flask import Flask, jsonify
import graph

app = Flask(__name__)

@app.route('/edits/<username>')
def get_edits(username):

    data = graph.get_edits(username);
    data = [d for d in data]
    json = jsonify(data)
    return json