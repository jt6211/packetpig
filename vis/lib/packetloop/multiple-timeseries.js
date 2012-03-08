Packetloop.MultipleTimeSeries = {}

Packetloop.MultipleTimeSeries.updateSorting = function(value)
{
  Packetloop.MultipleTimeSeries.update(value)
}

Packetloop.MultipleTimeSeries.updateChartData = function(selFil)
{
  var x = Packetloop.MultipleTimeSeries.x
  var y = Packetloop.MultipleTimeSeries.y

  var chartData = Packetloop.MultipleTimeSeries.categories.map(function(d, i) {
    return Packetloop.MultipleTimeSeries.data[selFil][Packetloop.MultipleTimeSeries.categories[i]]
  })
  y.domain([0, d3.max(chartData, function(d) {
    return d3.max(d, function(f) {
      return f.y
    })
  })])

  if (Packetloop.MultipleTimeSeries.type == 'histogram') {
    x.domain([0, Packetloop.MultipleTimeSeries.max])
  }

  return chartData
}

Packetloop.MultipleTimeSeries.create = function(rows) {

  // Detect ts or histogram
  var ists = 1000 * parseInt(rows[0][2])
  var r1 = (new Date(2000, 1, 1)).getTime()
  var r2 = (new Date(2020, 1, 1)).getTime()
  if (r1 < ists && r2 > ists)
    Packetloop.MultipleTimeSeries.type = 'timeseries'
  else
    Packetloop.MultipleTimeSeries.type = 'histogram'

  /*
  filter,category,ts,value
  filter,category,histogramkey,value
  */

  var w = 256
  Packetloop.MultipleTimeSeries.h = 95
  var p = 20

  Packetloop.MultipleTimeSeries.selectedFilter = rows[1][0]

  var min
  var max

  if (Packetloop.MultipleTimeSeries.type == 'timeseries') {
    min = d3.min(rows, function(d) { return parseInt(d[2]) })
    max = d3.max(rows, function(d) { return parseInt(d[2]) })
  }

  if (Packetloop.MultipleTimeSeries.type == 'histogram') {
    min = 0
    max = 0
  }

  var x

  if (Packetloop.MultipleTimeSeries.type == 'timeseries') {
    x = d3.time.scale()
    x.domain([new Date(min * 1000), new Date(max * 1000)])
  }

  if (Packetloop.MultipleTimeSeries.type == 'histogram') {
    x = d3.scale.linear()
  }

  x.range([15, w])

  var y = d3.scale.linear()
  y.range([Packetloop.MultipleTimeSeries.h, 20])

  var area = function(y) {
    return d3.svg.area()
      .x(function(d) { return x(d.x) })
      .y0(Packetloop.MultipleTimeSeries.h - 1)
      .y1(function(d) { return y(d.y) })
  }

  var filters = []
  Packetloop.MultipleTimeSeries.categories = []
  Packetloop.MultipleTimeSeries.data = {}

  // sort the Packetloop.MultipleTimeSeries.data into Packetloop.MultipleTimeSeries.data[filter][cat] = [{x:, y:}] while keeping track of
  // a list of filters and Packetloop.MultipleTimeSeries.categories
  for (var i = 1; i < rows.length; i++) {

    var row = rows[i]
    var filter = row[0]
    var category = row[1]

    if (!Packetloop.MultipleTimeSeries.data[filter]) {
      var filterId = filters.length
      Packetloop.MultipleTimeSeries.data[filter] = []
      filters.push(filter)
      $('#filters').append('<li id="filter' + filterId + '">' + filter + '</li>')
    }

    if ($.inArray(category, Packetloop.MultipleTimeSeries.categories) == -1) {
      Packetloop.MultipleTimeSeries.categories.push(category)
    }

    if (!Packetloop.MultipleTimeSeries.data[filter][category]) {
      Packetloop.MultipleTimeSeries.data[filter][category] = []
    }

    var key
    if (Packetloop.MultipleTimeSeries.type == 'timeseries') {
      key = new Date(1000 * parseInt(row[2]))
    } else {
      key = Packetloop.MultipleTimeSeries.data[filter][category].length
      if (key > max)
        max = key
    }

    Packetloop.MultipleTimeSeries.max = max

    Packetloop.MultipleTimeSeries.data[filter][category].push({
      x: key,
      y: parseFloat(row[3]),
    })
  }

  Packetloop.MultipleTimeSeries.x = x
  Packetloop.MultipleTimeSeries.y = y
  Packetloop.MultipleTimeSeries.selectedFilter = filters[0]
  Packetloop.MultipleTimeSeries.filters = filters

  var chartData = Packetloop.MultipleTimeSeries.updateChartData(
    Packetloop.MultipleTimeSeries.selectedFilter)
  Packetloop.MultipleTimeSeries.categories.forEach(function(d, i) {

    var data = chartData[i]
    var ticks = 3

    var vis = d3.select('#vis')
      .append('div')
        .attr('class', function() {
          if (i == 1 || i == 5 || i == 9) return 'chart noborder'
          else if (i == 4 || i == 8 || i == 12) return 'chart endrow'
          else return 'chart'
        })
      .append('svg:svg')
          .attr('width', w + p * 2)
          .attr('height', Packetloop.MultipleTimeSeries.h + p * 2)
        .append('svg:g')
          .attr('transform', 'translate(' + p + ',' + p + ')')

    var rules = vis.selectAll('g.rule')
      .data(x.ticks(ticks))
      .enter().append('svg:g')
        .attr('class', 'rule')

    rules.append('svg:line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', 20)
      .attr('y2', Packetloop.MultipleTimeSeries.h - 1)

    rules.append('svg:line')
      .attr('class', 'axis')
      .attr('y1', Packetloop.MultipleTimeSeries.h)
      .attr('y2', Packetloop.MultipleTimeSeries.h)
      .attr('x1', -20)
      .attr('x2', w+1)

    vis.append('svg:text')
      .attr('x', -18)
      .text(d)
      .attr('class', 'aheader')

    rules.append('svg:text')
      .attr('class', 'ticklabel')
      .attr('y', Packetloop.MultipleTimeSeries.h)
      .attr('x', x)
      .attr('dy', 11)
      .attr('text-anchor', 'middle')
      .text(x.tickFormat(ticks))

    vis.append('svg:text')
      .attr('x', 12)
      .attr('y', Packetloop.MultipleTimeSeries.h - 4)
      .text(y.domain()[0])
      .attr('text-anchor', 'end')
      .attr('class', 'ticklabel')

    vis.append('svg:text')
      .attr('x', 12)
      .attr('y', 20)
      .text(y.domain()[1])
      .attr('text-anchor', 'end')
      .attr('class', 'ticklabel ytick')

    if (Packetloop.MultipleTimeSeries.type == 'timeseries') {
      vis.append('svg:path')
        .data([data])
        .attr('class', function(d, i) { return 'c' + category } )
        .attr('d', area(y))
    }

    if (Packetloop.MultipleTimeSeries.type == 'histogram') {
      vis.selectAll('rect.bar')
        .data(data)
      .enter().append('svg:rect')
        .attr('class', function(d, i) { return 'bar c' + category } )
        .attr('x', function(d) { return 1 + x(d.x) })
        .attr('height', function(d) { return Packetloop.MultipleTimeSeries.h - y(d.y) })
        .attr('y', function(d) { return y(d.y) })
        .attr('width', (x.range()[1] - x.range()[0]) / data.length)
    }

    Packetloop.MultipleTimeSeries.vis = vis

  })

  $('#filters li').click(function(e) {
    var filterId = parseInt(this.id.replace('filter', ''))
    Packetloop.MultipleTimeSeries.selectedFilter = Packetloop.MultipleTimeSeries.filters[filterId]
    Packetloop.MultipleTimeSeries.update()
  })
}

Packetloop.MultipleTimeSeries.update = function(sorted)
{
  var x = Packetloop.MultipleTimeSeries.x
  var y = Packetloop.MultipleTimeSeries.y
  var chartData = Packetloop.MultipleTimeSeries.updateChartData(Packetloop.MultipleTimeSeries.selectedFilter)

  if (sorted) {
    chartData = chartData.map(function(d) {
      var d = $.extend(true, [], d);
      return d.sort(function(a, b) {
        if (a.y > b.y) return -1
        if (a.y < b.y) return +1
        return 0
      })
    })
  }

  // timeseries area
  d3.selectAll('path').each(function(d, i) {
    d3.select(this)
      .data([chartData[i]])
    .transition()
      .duration(500)
      .attr('d', area(y))
  })

  // bar
  d3.selectAll('svg').each(function(d, i) {
    d3.select(this).selectAll('rect.bar')
      .data(chartData[i])
    .transition()
      .duration(500)
      .attr('height', function(d) { return Packetloop.MultipleTimeSeries.h - y(d.y) })
      .attr('y', function(d) { return y(d.y) })
  })

  d3.selectAll('.ytick').each(function(d, i) {
    d3.select(this)
    .transition()
      .duration(0)
      .text(y.domain()[1])
  })
}
