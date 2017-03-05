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
  return d3.timeDays(startDate, currDate).map(function(d) {
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
var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];


var loadData = function() {
  d3.select('#username-spinner').transition().style('opacity', 1);
  var username = usernameInput.value;
  if (username) {
    d3.json('/edits/' + username, function(err, data) {
      var a = [];
      a = d3.timeDays(startDate, currDate).map(function(d) {
        return {
          time: d,
          value: 0
        };
      });
      var key;
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          var day = d3.timeDay.count(d3.timeDay(startDate), timeParse(key));
          if (day < a.length && day > 0) {
            a[day].value += data[key];
          }
        }
      }
      updateData(a);
    });
  } else {
    updateData(randomData());
  }
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

var loadDayInfo = function (d) {
  d3.select('#dayinfo-spinner').transition().duration(1000).style('opacity', 1);
  setTimeout(function() {
    updateDayInfo({
      articles: [{
        name: 'placeholder',
        count: 2
      }]
    });
  }, 1000);
};

var updateDayInfo = function(dayInfo) {
  d3.select('#dayinfo-spinner').transition().duration(1000).style('opacity', 0);
  if (!dayInfoSelection || dayInfoSelection.empty()) {
    dayInfoSelection = d3.select('#results-info').append('div');
  }
  var sel = dayInfoSelection;
  var selUpdate = sel.selectAll('.article')
    .data(dayInfo.articles);
  var newSel = selUpdate.enter()
    .append('div')
    .classed('article', true);
  newSel.append('span').classed('article-name', true);
  newSel.append('span').classed('article-count', true);
  selUpdate = newSel.merge(selUpdate);
  if (dayInfo.articles.length) {
    selUpdate.select('.article-name').html(function(d) {
      return d.name;
    });
    selUpdate.select('.article-count').html(function(d) {
      return d.count;
    });
  } else {
    sel.html('No edits on ' + dayInfo.date);
  }
  selUpdate.exit().remove();
};

usernameInput.addEventListener('change', function() {
  loadData();
});
loadData();
