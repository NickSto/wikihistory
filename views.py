from django.http import HttpResponse
import json
from . import wikiedits
try:
  from traffic.lib import add_visit
except ImportError:
  def add_visit(request, response):
    return response


def edits_list(request, user):
  params = request.GET
  format = params.get('format', 'human')
  limit = params.get('limit')
  if limit:
    limit = int(limit)
  response = add_visit(request, HttpResponse(content_type='text/plain; charset=utf-8'))
  edits = []
  for edit in wikiedits.get_edits(user, limit):
    if format == 'human':
      response.write('{}\t{}\n'.format(edit['timestamp'], edit['title']))
    elif format == 'json':
      edits.append(edit)
  if format == 'json':
    json.dump(edits, response)
  return response


def edits_per_day(request, user):
  date_counts = {}
  for date, count in wikiedits.get_edits_per_day(user, time_limit=365):
    date_counts[date] = count
  response = add_visit(request, HttpResponse(content_type='application/json; charset=utf-8'))
  json.dump(date_counts, response)
  return response


def day_edits(request, user, date):
  edits = list(wikiedits.get_edits_for_day(user, date))
  response = add_visit(request, HttpResponse(content_type='application/json; charset=utf-8'))
  json.dump(edits, response)
  return response
