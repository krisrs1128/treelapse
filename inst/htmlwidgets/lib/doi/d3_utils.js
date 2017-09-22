/*******************************************************************************
* @fileoverview Helper functions for d3 visualizations
* @author kriss1@stanford.edu
*******************************************************************************/

/**
 * Attach a filled rectangle to an HTML element
 *
 * @param elem {d3 selection} The html element onto which we will attach the
 *     background rectangle.
 * @param width {float} The width of the drawn rectangle.
 * @param height {float} The height of the drawn rectangle.
 * @param fill {string} The hex code for the fill color of the background
 *     rectangle.
 * @return null
 * @side-effects Attaches a rectangle #background_rect to the element elem.
 **/
function setup_background(elem, width, height, fill) {
  var svg_elem = d3.select(elem)
      .append("svg")
      .attrs({
	      width: width,
	      height: height
      });

  draw_rect(elem, width, height, "background_rect", fill);
}

/**
 * Draw x / y axes given a dictionary of scales
 *
 * @param {d3 selection} elem The html selection on which all the brushes to
 *     check are located.
 * @param scales {dictionary of d3-scales} An object with keys "x" and "y"
 *     giving scales from which x and y positions of the tree nodes are
 *     calculated.
 * @return null
 * @side-effects Draws x and y axes on group elements #x_axis and #y_axis
 **/
function draw_axes(elem, scales, display_opts) {
  x_axis = d3.axisBottom(scales.x)
    .ticks(display_opts.n_ticks_x)
    .tickSize(display_opts.tick_size);
  d3.select(elem)
    .select("#x_axis")
    .attr("transform", "translate(0, " + scales.y.range()[0] + ")")
    .call(x_axis);
  d3.select(elem)
    .selectAll("#x_axis > .tick > text")
    .attrs({
      "font-size": display_opts.axis_font_size,
      "font-family": display_opts.font_family,
      "text-anchor": display_opts.axis_text_anchor,
      "transform": "rotate("+ display_opts.x_axis_rotation + ")"
    });

  // almost same, for y-axis now
  y_axis = d3.axisLeft(scales.y)
    .ticks(display_opts.n_ticks_y)
    .tickSize(display_opts.tick_size);
  d3.select(elem)
    .select("#y_axis")
    .attr("transform", "translate(" + scales.x.range()[0] + ", 0)")
    .call(y_axis);
  d3.select(elem)
    .selectAll("#y_axis > .tick > text")
    .attrs({
      "font-size": display_opts.axis_font_size,
      "font-family": display_opts.font_family,
      "transform": "rotate("+ display_opts.y_axis_rotation + ")"
    });
}

/**
 * Update x / y axes to reflect new scales
 *
 * @param {d3 selection} elem The html selection on which all the brushes to
 *     check are located.
 * @param scales {dictionary of d3-scales} An object with keys "x" and "y"
 *     giving scales from which x and y positions of the tree nodes are
 *     calculated.
 * @return null
 * @side-effects Updates x and y axes on group elements #x_axis and #y_axis
 *     to reflect the new scales.
 **/
function update_axes(elem, scales, display_opts) {
  x_axis = d3.axisBottom(scales.x)
    .ticks(display_opts.n_ticks_x)
    .tickSize(display_opts.tick_size);
  d3.select(elem)
    .select("#x_axis")
    .attr("transform", "translate(0, " + scales.y.range()[0] + ")")
    .transition()
    .duration(100)
    .call(x_axis);
  d3.select(elem)
    .selectAll("#x_axis > .tick > text")
    .attrs({
      "font-size": display_opts.axis_font_size,
      "font-family": display_opts.font_family,
      "text-anchor": display_opts.axis_text_anchor,
      "transform": "rotate("+ display_opts.x_axis_rotation + ")"
    });

  y_axis = d3.axisLeft(scales.y)
    .ticks(display_opts.n_ticks_y)
    .tickSize(display_opts.tick_size);
  d3.select(elem)
    .select("#y_axis")
    .attr("transform", "translate(" + scales.x.range()[0] + ", 0)")
    .transition()
    .duration(100)
    .call(y_axis);
  d3.select(elem)
    .selectAll("#y_axis > .tick > text")
    .attrs({
      "font-size": display_opts.axis_font_size,
      "font-family": display_opts.font_family,
      "transform": "rotate("+ display_opts.y_axis_rotation + ")"
    });
}

/**
 * Draw a filled rectangle
 * @param {d3 selection} elem The html selection on which all the brushes to
 *     check are located.
 * @param {float} width The width of the display's rectangle background.
 * @param {float} height The height the display's rectangle background.
 * @param {string} id The ID to give the attached rectangle
 * @param fill {string} The hex code for the fill color of the background
 *     rectangle.
 **/
function draw_rect(elem, width, height, id, fill) {
  d3.select(elem)
    .select("svg")
    .append("rect")
    .attrs({
      "id": id,
      "height": height,
      "width": width,
      "fill": fill
    });
}

/**
 * Initialize a set of empty group elements on a parent element
 *
 * @param elem {d3 selection} The html element onto which we will attach the
 *     background rectangle.
 * @param group_names {array of string}
 * @return null
 * @side-effects For each element x in group_names, creates a group element #x
 * on top of elem.
 **/
function setup_groups(elem, group_names) {
  elem.selectAll("g")
    .data(group_names, function(d) { return d; }).enter()
    .append("g")
    .attr("id", function(d) { return d;});
}

/**
 * Attach a search box to an html element
 *
 * @param elem {d3 selection} The html element onto which we will attach the
 *     background rectangle.
 * @return null
 * @side-effects Attaches (1) a group called "search-{id associated with elem}"
 * and (2) a text input to the selection called elem.
 **/
function setup_search(elem, options) {
  var elem_id = d3.select(elem).attr("id");
  var search = d3.select(elem)
      .append("g")
      .attr("id", "search-" + elem_id);

  search.append("select")
    .attrs({
      "id": "search_box-" + elem_id,
      "type": "text",
      "multiple": true
    })
    .classed("chosen-select", true);

  d3.select("#search_box-" + elem_id)
    .selectAll("option")
    .data(options).enter()
    .append("option")
    .attr("value", function(d) { return d;})
    .text(function(d) { return d;});
  $("#search_box-" + elem_id).chosen({
    "search_contains": true,
    "width": "30%"
  });

  search.selectAll(".chosen-container .chosen-choices")
    .style("max-height", "25px")
    .style("font-size", "12px");
}

/**
 * Associate an id to a d3 link
 *
 * @param d {d3 link} An object with a source.data.id and target.data.id
 * attribute, like the single elements in the arrays generated by
 * d3.hierarchy.links().
 * @return {string} The source name and target name, pasted together by a '-'.
 **/
function link_id_fun(d) {
  return d.source.data.id + "-" + d.target.data.id;
}

/**
 * Attach a button to an html element
 *
 * @param elem {d3 selection} The html element onto which we will attach the
 *     background rectangle.
 * @param text {string} The text to put on the button.
 * @param click_fun {function} A function to execute when the button is clicked.
 * @return null
 * @side-effect Attaches a button to the html element elem  with the text "text"
 * and which executes click_fun when it is clicked.
 **/
function add_button(elem, text, click_fun) {
  d3.select(elem)
    .append("button")
    .style("height", 10)
    .on("click", click_fun)
    .text(text);
}

/**
 * Return an object with default attribute functions for svg circles
 *
 * @return {dictionary of functions} A dictionary containing functions that can
 * be directly input to a d3 circle selection's .attr() to give some default
 * styling / positioning. This is a template from which different circle styling
 * and positioning functions can be created.
 **/
function node_attr_defaults() {
  return {
    "cx": function(d) { return d.x; },
    "cy": function(d) { return d.y; },
    "fill": function(d) { return "black"; },
    "id": function(d) { return d.data.id; },
    "r": function(d) { return 2; },
    "stroke": function(d) { return "black"; },
    "stroke-width": function(d) { return 0; },
    "text": function(d) { return; }
  };
}

/**
 * Return an object with default attribue functions for svg paths
 *
 * @return {dictionary of functions} A dictionary containing functions that can
 * be directly input to a d3 svg-path selection's .attr() to give some default
 * styling / positioning. This is a template from which different circle styling
 * and positioning functions can be created.
 **/
function link_attr_defaults() {
  return {
    "id": function(d) {
      return d.source.data.id + "-" + d.target.data.id;
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

/**
 * Return an object with default attribue functions for text elements
 *
 * @return {dictionary of functions} A dictionary containing functions that can
 * be directly input to a d3 text selection's .attr() to give some default
 * styling / positioning. This is a template from which different circle styling
 * and positioning functions can be created.
 **/
function text_attr_defaults() {
  return {
    "id": function(d) { return d.data.id; },
    "text": function(d) { return d.data.id; },
    "x": function(d) {return d.x; },
    "y": function(d) {return d.y; },
    "fill": function(d) {return d.fill; },
    "font-family": "Roboto",
    "font-size": function(d) { return d.size; }
  };
}

/**
 * Template for generic enter / update / exit pattern
 *
 * @param svg_type {string} The type of element to append (e.g., "text" or
 *     "circle").
 * @param selection {d3 selection} The html element onto which the new data are
 *    to be entered / updated / exited.
 * @param data {array} An array containing all the data elements to associate to
 *    the specified selection.
 * @param class_name {string} The class type to associate with each appended
 *     element.
 * @param attr_funs {dictionary of functions} An object specifying all the
 *     attribute functions to attach to each element. This gives the position
 *     and styling for each element, for example. See node_attr_defaults() for
 *     example input.
 * @param duration {float} The duration of the transition for updates and exits.
 * @return null
 * @side-effects Associates data to the selection and sets up entering /
 *     updating / exiting with the specified types and attributes.
 **/
function selection_update(svg_type, selection, data, class_name, attr_funs, duration) {
  var transitioner = d3.transition()
      .duration(duration)
      .ease(d3.easeCubic);

  var new_selection = selection
      .selectAll("." + class_name)
      .data(data, attr_funs.id);

  // fade in
  enter_attr_funs = jQuery.extend({}, attr_funs);
  attr_funs.opacity = 1;
  enter_attr_funs.opacity = 0;

  new_selection.exit().remove();
  new_selection.enter()
    .append(svg_type)
    .classed(class_name, true)
    .attrs(enter_attr_funs);

  selection
    .selectAll("." + class_name)
    .text(attr_funs.text) // empty if not a text selection
    .transition(transitioner)
    .attrs(attr_funs);
}

/**
 * Get the IDs in the search box
 *
 * @param {d3 selection} elem The html selection on which all the brushes to
 *     check are located.
 * @return {array of string} An array of strings that are currently selected in
 *     the search box.
 **/
function get_search_values(elem) {
  var search_id = "#search_box-" + d3.select(elem).attr("id");
  return [""].concat($(search_id).val());
}

/**
 * Build a hierarchical object from an htmlwidgets parsed edgelist
 *
 * @param {dictionary of arrays} edge_arrays An object with two keys, "parents"
 *     and "children", each linked to an array of strings. The i^th element of
 *     "parents" is the parent to the i^th element of "children".
 * @param {string} root The name of the root node in the edgelist.
 * @return {array of objects} A reshaped version of edge_arrays, which is just
 *      one array but whose elements are tuples of the form
 *      {"parent": "x", "child": "y"}
 **/
function stratified_tree(edge_arrays, root) {
  var edges = [{"parent": "", "name": root}];
  for (var i = 0; i < edge_arrays.parent.length; i++) {
    edges.push({
      "parent": edge_arrays.parent[i],
      "name": edge_arrays.child[i]
    });
  }

  return d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
  (edges);
}

/**
 * Helper function to check if value is numeric
 *
 * http://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers
 * @param {string or float} n The value we want to check is numeric or not.
 * @return {bool} true if is numeric, false otherwise.
 **/
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
