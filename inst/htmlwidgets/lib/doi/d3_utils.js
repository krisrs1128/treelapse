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

function setup_groups(svg, group_names) {
  svg.selectAll("g")
    .data(group_names).enter()
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

function add_button(elem, text, click_fun) {
  d3.select(elem)
    .append("button")
    .on("click", click_fun)
    .text(text);
}
