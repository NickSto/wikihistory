from django.conf.urls import url

from . import views

app_name = 'wikihistory'
urlpatterns = [
  url(r'^(?P<user>.+)$', views.view, name='view'),
]
