from django.shortcuts import render
from django.http import HttpResponse
import json
from . import graph

def view(request, user):
  params = request.GET
  format = params.get('format', 'human')
  limit = params.get('limit')
  if limit:
    limit = int(limit)
  response = HttpResponse(content_type='text/plain; charset=utf-8')
  edits = []
  for edit in graph.get_edits(user, limit):
    if format == 'human':
      response.write('{}\t{}\n'.format(edit['timestamp'], edit['title']))
    elif format == 'json':
      edits.append(edit)
  if format == 'json':
    json.dump(edits, response)
  return response
