/**
* Helper functions for d3 visualizations
**/

function setup_background(elem, width, height, fill) {
  var svg_elem = d3.select(elem)
      .append("svg")
      .attrs({
	width: width,
	height: height
      });

  var rect = d3.select("svg")
      .append("rect")
      .attrs({
	id: "background_rect",
	width: width,
	height: height,
	fill: fill
      });

}

function setup_groups(svg) {
  svg.selectAll("g")
    .data(["links", "nodes", "text"]).enter()
    .append("g")
    .attr("id", function(d) { return d;});
}

function setup_search(elem) {
  var search = d3.select(elem)
    .append("g")
    .attr("id", "search");

  search.append("input")
    .attrs({
      "id": "search_box",
      "type": "text"
    });

}

function link_id_fun(d) {
  return d.source.data.name + "-" + d.target.data.name;
}

function get_matches(names, search_str) {
  var matches = [];
  search_str = search_str.toLowerCase();
  var lower_names = names.map(
    function(d) { return d.toLowerCase(); }
  );

  for (var i = 0; i < names.length; i++) {
    if (lower_names[i].search(search_str) != -1) {
      matches.push(names[i]);
    }
  }
  return matches;
}
