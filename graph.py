#!/usr/bin/env python3
from __future__ import division
from __future__ import print_function
from __future__ import absolute_import
from __future__ import unicode_literals
import sys
import json
import errno
import logging
import argparse
import collections
import urllib.request
from datetime import datetime, timedelta

ARG_DEFAULTS = {'log':sys.stderr, 'volume':logging.ERROR}
DESCRIPTION = """Get a user's whole edit history. Currently prints the time and page name of the
edit."""
USAGE = '$ %(prog)s UserName > edits.txt'

# https://en.wikipedia.org/w/api.php?action=query&format=json&list=usercontribs&formatversion=2
# &uclimit=max&ucuser=Qwerty0&uccontinue=20110307123212|417593116

API_SCHEME = 'https'
API_DOMAIN = 'en.wikipedia.org'
API_PATH = '/w/api.php'
API_STATIC_PARAMS = {'action':'query', 'format':'json', 'list':'usercontribs', 'formatversion':'2',
                     'uclimit':'max'}


def make_argparser():

  parser = argparse.ArgumentParser(description=DESCRIPTION, usage=USAGE)
  parser.set_defaults(**ARG_DEFAULTS)

  parser.add_argument('user',
    help='The user to query.')
  parser.add_argument('-l', '--limit', type=int,
    help='Limit the number of edits retrieved to this number.')
  parser.add_argument('-L', '--log', type=argparse.FileType('w'),
    help='Print log messages to this file instead of to stderr. Warning: Will overwrite the file.')
  parser.add_argument('-q', '--quiet', dest='volume', action='store_const', const=logging.CRITICAL)
  parser.add_argument('-v', '--verbose', dest='volume', action='store_const', const=logging.INFO)
  parser.add_argument('-D', '--debug', dest='volume', action='store_const', const=logging.DEBUG)

  return parser


def main(argv):

  parser = make_argparser()
  args = parser.parse_args(argv[1:])

  logging.basicConfig(stream=args.log, level=args.volume, format='%(message)s')
  tone_down_logger()

  # for edit in get_edits(args.user, args.limit):
  #   print(edit['timestamp'], edit['title'], sep='\t')
  for date, count in get_edits_per_day(args.user, args.limit):
    print(date, count, sep='\t')


def get_edits(user, limit=None, time_limit=None):
  """time_limit in days"""

  total_edits = 0
  cont = None
  while True:

    data = get_data(user, cont)

    if 'error' in data:
      fail('API Error: {}\ninfo: {}'.format(data['error']['code'], data['error']['info']))

    for edit in data['query']['usercontribs']:
      formatted_time = datetime.strptime(edit['timestamp'], '%Y-%m-%dT%H:%M:%SZ')

      if time_limit and formatted_time < datetime.now() - timedelta(days=time_limit):
        return

      total_edits += 1
      if limit and total_edits > limit:
        return

      yield edit

    if 'continue' in data:
      cont = data['continue']['uccontinue']
    else:
      break


def get_edits_per_day(user, limit=None, time_limit=None):
  #TODO: Take timezone into account.

  last = None
  date_count = 0
  for edit in get_edits(user, limit=limit, time_limit=time_limit):
    date = edit['timestamp'].split('T')[0]
    if date != last:
      if last is not None:
        yield last, date_count
      date_count = 0
      last = date
    date_count += 1
  if last is not None:
    yield last, date_count


def make_url(user, cont=None):
  params = API_STATIC_PARAMS.copy()
  params['ucuser'] = user
  if cont:
    params['uccontinue'] = cont
  query_string = urllib.parse.urlencode(params)
  return urllib.parse.urlunparse((API_SCHEME, API_DOMAIN, API_PATH, None, query_string, None))


def get_data(user, cont):
  url = make_url(user, cont)
  logging.info(url)
  response = urllib.request.urlopen(url)
  if response.getcode() == 200:
    response_bytes = response.read()
    return json.loads(str(response_bytes, 'utf8'))
  else:
    fail('API returned an HTTP error {}: {}'.format(response.getcode(), response.reason))


def tone_down_logger():
  """Change the logging level names from all-caps to capitalized lowercase.
  E.g. "WARNING" -> "Warning" (turn down the volume a bit in your log files)"""
  for level in (logging.CRITICAL, logging.ERROR, logging.WARNING, logging.INFO, logging.DEBUG):
    level_name = logging.getLevelName(level)
    logging.addLevelName(level, level_name.capitalize())


def fail(message):
  logging.critical(message)
  if __name__ == '__main__':
    sys.exit(1)
  else:
    raise Exception('Unrecoverable error')


if __name__ == '__main__':
  try:
    sys.exit(main(sys.argv))
  except IOError as ioe:
    if ioe.errno != errno.EPIPE:
      raise
