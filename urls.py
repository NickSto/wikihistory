from django.conf.urls import url

from . import views

app_name = 'wikihistory'
urlpatterns = [
  url(r'^edits_list/(?P<user>.+)$', views.edits_list, name='edits_list'),
  url(r'^edits_per_day/(?P<user>.+)$', views.edits_per_day, name='edits_per_day'),
  url(r'^day_edits/(?P<user>.+)/(?P<date>.+)$', views.day_edits, name='day_edits'),
]
