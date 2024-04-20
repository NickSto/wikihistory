from django.urls import re_path

from . import views

app_name = 'wikihistory'
urlpatterns = [
  re_path(r'^edits_list/(?P<user>.+)$', views.edits_list, name='edits_list'),
  re_path(r'^edits_per_day/(?P<user>.+)$', views.edits_per_day, name='edits_per_day'),
  re_path(r'^day_edits/(?P<user>.+)/(?P<date>.+)$', views.day_edits, name='day_edits'),
]
