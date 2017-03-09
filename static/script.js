var width;
var height;
var margin = {
  top: 24,
  bottom: 10,
  left: 38,
  right: 10
};
var maxWeeks = 54;
var cellSize = 16;
var legendPadding = cellSize / 4;
var numLegendBoxes = 5;
var legendTextPadding = 6;
var legendOffsetX = margin.left + cellSize * (maxWeeks - 2) - Math.ceil(64 / cellSize) * cellSize - (numLegendBoxes - 1) * (legendPadding + cellSize);
var legendOffsetY = margin.top + cellSize * 8;
height = legendOffsetY + cellSize + margin.bottom;
width = margin.left + (maxWeeks) * cellSize + margin.right;
var colorStretch = 0.4;
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
var svg = d3.select('#svg-calendar').attr('width', width).attr('height', height);
svg.attr('viewBox', '0 0 ' + width + ' ' + height);
var calendarSvg = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
var labelSvg = svg.append('g');
var legendSvg = svg.append('g');
var dayLabels = [{
    name: 'Mon',
    day: 1
  },
  {
    name: 'Wed',
    day: 3
  },
  {
    name: 'Fri',
    day: 5
  }
];

labelSvg.selectAll('.day-label').data(dayLabels).enter()
  .append('text').classed('day-label', true).text(function(d) {
    return d.name;
  }).attr('y', function(d) {
    return margin.top + (d.day + 0.5) * cellSize;
  }).style('dominant-baseline', 'middle');

var colorScale = d3.scaleSequential(d3.interpolateGreens);
colorScale.domain([-numLegendBoxes*colorStretch, numLegendBoxes - 1]);
legendSvg.selectAll()
  .data(d3.range(numLegendBoxes))
  .enter()
  .append('rect')
  .classed('legend-rect', true)
  .attr('x', function(d) {
    return legendOffsetX + d * (cellSize + legendPadding);
  })
  .attr('y', legendOffsetY)
  .attr('width', cellSize)
  .attr('height', cellSize)
  .attr('fill', function(d) {
    return colorScale(d);
  });

legendSvg.append('text')
  .attr('x', legendOffsetX - legendTextPadding)
  .attr('y', legendOffsetY + (cellSize / 2))
  .classed('legend-text', true)
  .style('text-anchor', 'end')
  .style('dominant-baseline', 'middle')
  .text('Less Edits');

legendSvg.append('text')
  .attr('x', legendOffsetX + (cellSize + legendPadding) * (numLegendBoxes) - legendPadding + legendTextPadding)
  .attr('y', legendOffsetY + (cellSize / 2))
  .classed('legend-text', true)
  .style('text-anchor', 'start')
  .style('dominant-baseline', 'middle')
  .text('More Edits');


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
var dayInfoSelection;
var weeksFromStart = function(week) {
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
      d3.select('#username-spinner').transition().duration(1000).style('opacity', 0);
      if (err) {
        console.error(err);
        currUser = "Error Loading User";
        updateData(randomData());
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
  d3.select('#current-user').html(currUser);
  var maxEdits = d3.max(data, function(d) {
    return d.value;
  });
  colorScale.domain([-maxEdits * colorStretch, maxEdits]);
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
    	var editStr = d.value === 1 ? 'edit' : 'edits';
      return d.value + ' ' + editStr + ' on ' + timeFormat(d.time);
    });
  dayRects.attr("x", function(d) {
      return weeksFromStart(d.time) * cellSize;
    })
    .attr("y", function(d) {
      return d.time.getDay() * cellSize;
    });
  dayRects.transition().duration(1000)
    .style('fill', function(d) {
      return d.value >= 1 ? colorScale(d.value) : '#fff';
    });
  var monthLabelData = [];
  data.forEach(function(d) {
    var time = d.time;
    if (time.getDate() === 14) {
      monthLabelData.push({
        name: monthNames[time.getMonth()],
        week: weeksFromStart(d.time)
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
var loadDayInfo = function(d) {
  if (!currUser) {
    return;
  }
  d3.select('#dayinfo-spinner').transition().duration(1000).style('opacity', 1);
  d3.json('/day_edits/' + currUser + '/' + timeFormat(d.time), function(err, data) {
    d3.select('#dayinfo-spinner').transition().duration(1000).style('opacity', 0);
    if (err) {
      console.error(err);
      d3.select('#dayinfo-status').html('Error loading info for ' + timeFormat(d.time));
      return;
    }
    updateDayInfo({
      time: d.time,
      articles: data.map(function(d) {
        return {
          name: d.title,
          articleLink: 'http://en.wikipedia.org/wiki/' + d.title,
          count: d.edits
        };
      })
    });
  });
};

var dayInfoTable = d3.select('#dayinfo-table');
var updateDayInfo = function(dayInfo) {
  var selUpdate = dayInfoTable.selectAll('.article-row')
    .data(dayInfo.articles);
  var newSel = selUpdate.enter()
    .append('tr')
    .classed('article-row', true);
  newSel.append('td').classed('article-name', true);
  newSel.append('td').classed('article-count', true);
  var sel = newSel.merge(selUpdate);
  var status;
  if (dayInfo.articles.length) {
    sel.select('.article-name').html(function(d) {
      return '<a href="' + d.articleLink + '">' + d.name + '</a>';
    });
    sel.select('.article-count').html(function(d) {
      return d.count;
    });
    status = 'Edits on ' + timeFormat(dayInfo.time);
  } else {
    status = 'No edits on ' + timeFormat(dayInfo.time);
  }
  d3.select('#dayinfo-status').html(status);
  selUpdate.exit().remove();
};

usernameInput.addEventListener('change', function() {
  loadData();
});
loadData();
