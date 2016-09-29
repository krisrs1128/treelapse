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

function node_attr_defaults() {
  return {
    "id": function(d) { return d.data.name; },
    "text": function(d) { return; },
    "cx": function(d) { return d.x; },
    "cy": function(d) { return d.y; },
    "fill": function(d) { return "black"; },
    "r": function(d) { return 2; },
    "stroke": function(d) { return "black"; },
    "stroke-width": function(d) { return 0; },
  };
}

function link_attr_defaults() {
  return {
    "id": function(d) {
      return d.source.data.name + "-" + d.target.data.name;
    },
    "text": function(d) { return; },
    "fill": function(d) { return "none"; },
    "stroke": function(d) { return "black"; },
    "stroke-width": function(d) { return 2; },
    "d": function(d) {
      return "M" + d.target.x + "," + d.target.y +
        "C" + d.target.x + "," + (d.target.y + d.source.y) / 2 +
        " " + d.source.x + "," +  (d.target.y + d.source.y) / 2 +
        " " + d.source.x + "," + d.source.y;
    }
  };
}

function link_attr_defaults() {
  return {
    "id": function(d) {
      return d.source.data.name + "-" + d.target.data.name;
    },
    "fill": function(d) { return "none"; },
    "stroke": function(d) { return "black"; },
    "stroke-width": function(d) { return 2; },
    "d": function(d) {
      return "M" + d.target.x + "," + d.target.y +
        "C" + d.target.x + "," + (d.target.y + d.source.y) / 2 +
        " " + d.source.x + "," +  (d.target.y + d.source.y) / 2 +
        " " + d.source.x + "," + d.source.y;
    }
  };
}

function text_attr_defaults() {
  return {
    "id": function(d) { return d.data.name; },
    "text": function(d) { return d.data.name; },
    "x": function(d) {return d.x; },
    "y": function(d) {return d.y; },
    "fill": function(d) {return d.fill; },
    "font-family": "Roboto",
    "font-size": function(d) { return d.size; }
  };
}

function selection_update(svg_type, elem, data, class_name, attr_funs) {
  var transitioner = d3.transition()
      .duration(1000)
      .ease(d3.easeCubic);

  var selection = elem.selectAll("." + class_name)
      .data(data, attr_funs.id);

  // fade in
  enter_attr_funs = jQuery.extend({}, attr_funs);
  attr_funs.opacity = 1;
  enter_attr_funs.opacity = 0;

  selection.exit().remove();
  selection.enter()
    .append(svg_type)
    .classed(class_name, true)
    .attrs(enter_attr_funs);

  d3.selectAll("." + class_name)
    .text(attr_funs.text) // empty if not a text selection
    .transition(transitioner)
    .attrs(attr_funs);
}
