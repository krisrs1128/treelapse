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
    "cx": function(d) { console.log(d); return d.x; },
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
    "fill": function(d) { return "none"; },
    "stroke": function(d) { return "black"; },
    "stroke_width": function(d) { return 2; },
    "d": function(d) {
      return "M" + d.target.x + "," + d.target.y +
        "C" + d.target.x + "," + (d.target.y + d.source.y) / 2 +
        " " + d.source.x + "," +  (d.target.y + d.source.y) / 2 +
        " " + d.source.x + "," + d.source.y;
    }
  };
}

function tree_nodes_base(elem, nodes, class_name, attr_funs) {
  var transitioner = d3.transition()
      .duration(1000)
      .ease(d3.easeCubic);

  var node_selection = elem.selectAll("." + class_name)
      .data(nodes, attr_funs.id);

  node_selection.exit().remove();

  node_selection.enter()
    .append("circle")
    .classed(class_name, true)
    .attrs(attr_funs);

    d3.selectAll("." + class_name)
      .transition(transitioner)
      .attrs(attr_funs);
}

function tree_links_base(elem, links, class_name, attr_funs) {
  var transitioner = d3.transition()
      .duration(1000)
      .ease(d3.easeCubic);

  var link_selection = elem.selectAll("." + class_name)
      .data(links, attr_funs.id);

  link_selection.exit().remove();

  link_selection.enter()
    .append("path", "g")
    .classed(class_name, true)
    .attrs({
      "id": attr_funs.id,
      "fill": attr_funs.fill,
      "stroke": attr_funs.stroke,
      "stroke-width": attr_funs.stroke_width
    });

    d3.selectAll("." + class_name)
      .transition(transitioner)
      .attrs({
	"fill": attr_funs.fill,
	"stroke": attr_funs.stroke,
	"stroke-width": attr_funs.stroke_width,
	"d": attr_funs.d
      });
}
