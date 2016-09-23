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
  svg.append("g")
    .attr("id", "links");

  svg.append("g")
    .attr("id", "nodes");

  svg.append("g")
    .attr("id", "text");
}

function link_id_fun(d) {
  return d.source.data.name + "-" + d.target.data.name;
}
