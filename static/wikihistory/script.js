var width = 960;
var height = 150;
var cellSize = 16;
var userSpinner = new Spinner({
  left: '20px',
  radius: 4,
  length: 4,
  width: 3
}).spin(d3.select('#username-spinner').node());
var dayInfoSpinner = new Spinner({
  radius: 4,
  length: 8,
  width: 4,
  top: '50px'
}).spin(d3.select('#dayinfo-spinner').node());
d3.select('#dayinfo-spinner').style('opacity', 0);
var usernameInput = document.getElementById('username-input');
var margin = {
  top: 30,
  bottom: 20,
  left: 50,
  right: 0
};
var svg = d3.select('#svg-calendar').attr('width', width).attr('height', height);
var calendarSvg = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
var labelSvg = svg.append('g');
var dayLabels = [{
  name: 'Mon',
  day: 1,
}, {
  name: 'Wed',
  day: 3,
}, {
  name: 'Fri',
  day: 5
}];
labelSvg.selectAll('.day-label').data(dayLabels).enter()
  .append('text').classed('day-label', true).text(function(d) {
    return d.name;
  }).attr('y', function(d) {
    return margin.top + (d.day + 0.5) * cellSize;
  }).style('dominant-baseline', 'middle');
var currDate = new Date();
var startDate = new Date(new Date().setFullYear(currDate.getFullYear() - 1));
var randomData = function() {
  return d3.timeDays(d3.timeDay(startDate), currDate).map(function(d) {
    return {
      time: d,
      value: Math.floor(Math.random() * (50))
    };
  });
};
var colorScale = d3.scaleLinear().range(['#fff', '#0f0']);
var dayInfoSelection;
var weekOfYear = function(week) {
  return d3.timeWeek.count(d3.timeWeek(startDate), week);
};
var timeParse = d3.timeParse('%Y-%m-%d');
var timeFormat = d3.timeFormat('%Y-%m-%d');
var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

var userDataLoader;
var loadData = function() {
  var username = usernameInput.value;
  var cancel = false;
  if (username) {
    d3.select('#username-spinner').transition().style('opacity', 1);
    d3.json('/edits_per_day/' + username, function(err, data) {
      if (cancel) {
        return;
      }
      currUser = username;
      var days = d3.timeDay.range(d3.timeDay(startDate), currDate).map(function(d) {
        return {
          time: d,
          value: 0
        };
      });
      var key;
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          var day = d3.timeDay.count(d3.timeDay(startDate), timeParse(key));
          if (day < days.length && day >= 0) {
            days[day].value += data[key];
          }
        }
      }
      updateData(days);
    });
  } else {
    updateData(randomData());
  }
  userDataLoader = {
    cancel: function() {
      cancel = true;
    }
  };
};

var updateData = function(data) {
  var daySelect = calendarSvg.selectAll('.day').data(data);
  colorScale.domain([0, d3.max(data, function(d) {
    return d.value;
  })]);
  d3.select('#username-spinner').transition().duration(1000).style('opacity', 0);
  var dayRects = daySelect.enter().append('rect')
    .classed('day', true)
    .attr('width', cellSize)
    .attr('height', cellSize)
    .style('fill', '#fff')
    .on('click', loadDayInfo);
  dayRects.append('title');
  dayRects = dayRects.merge(daySelect);
  daySelect.exit().remove();
  dayRects.select('title')
    .text(function(d) {
      return d.value + ' edits';
    });
  dayRects.attr("x", function(d) {
      return weekOfYear(d.time) * cellSize;
    })
    .attr("y", function(d) {
      return d.time.getDay() * cellSize;
    });
  dayRects.transition().duration(1000)
    .style('fill', function(d) {
      return colorScale(d.value);
    });
  var monthLabelData = [];
  data.forEach(function(d) {
    var time = d.time;
    if (time.getDate() === 14) {
      monthLabelData.push({
        name: monthNames[time.getMonth()],
        week: weekOfYear(d.time)
      });
    }
  });
  var monthLabelSelect = labelSvg.selectAll('.month-label').data(monthLabelData);
  var monthLabels = monthLabelSelect.enter()
    .append('text')
    .classed('month-label', true)
    .style('text-anchor', 'middle')
    .style('dominant-baseline', 'hanging')
    .attr('y', margin.top - 20)
    .merge(monthLabelSelect);
  monthLabels.attr('x', function(d) {
    return (d.week + 0.5) * cellSize + margin.left;
  }).text(function(d) {
    return d.name;
  });
  monthLabelSelect.exit().remove();
};
var currUser = '';
var loadDayInfo = function (d) {
  if(!currUser) {
    return;
  }
  d3.select('#dayinfo-spinner').transition().duration(1000).style('opacity', 1);
  d3.json('/day_edits/'+currUser+'/'+timeFormat(d.time), function(err, data) {
    updateDayInfo({
      time: d.time,
      articles: data.map(function(d){
        return {
          name: d.title,
          articleLink: 'http://en.wikipedia.org/wiki/'+d.title,
          count: d.edits
        }
      })
    });
  });
};

var dayInfoTable = d3.select('#dayinfo-table');
var updateDayInfo = function(dayInfo) {
  d3.select('#dayinfo-spinner').transition().duration(1000).style('opacity', 0);
  var sel = dayInfoTable;
  var selUpdate = sel.selectAll('.article-row')
    .data(dayInfo.articles);
  var newSel = selUpdate.enter()
    .append('tr')
    .classed('article-row', true);
  newSel.append('td').classed('article-name', true);
  newSel.append('td').classed('article-count', true);
  var sel = newSel.merge(selUpdate);
  if (dayInfo.articles.length) {
    sel.select('.article-name').html(function(d) {
      return '<a href="'+d.articleLink+'">' + d.name + '</a>';
    });
    sel.select('.article-count').html(function(d) {
      return d.count;
    });
    d3.select('#dayinfo-status').html('Edits on '+timeFormat(dayInfo.time));
  } else {
    d3.select('#dayinfo-status').html('No edits on ' + timeFormat(dayInfo.time));
  }
  selUpdate.exit().remove();
};

/*d3.select('#input-form').node().addEventListener('submit', function(e) {
  e.preventDefault();
});
*/
usernameInput.addEventListener('change', function() {
  loadData();
});
loadData();
