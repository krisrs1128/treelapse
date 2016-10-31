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

  var rect = svg_elem
      .append("rect")
      .attrs({
	"id": "background_rect",
	"width": width,
	"height": height,
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

  console.log(options);

  d3.select("#search_box-" + elem_id)
    .selectAll("option")
    .data(options).enter()
    .append("option")
    .attr("value", function(d) { return d;})
    .text(function(d) { return d;});
  $("#search_box-" + elem_id).chosen();
}

/**
 * Associate an id to a d3 link
 *
 * @param d {d3 link} An object with a source.data.name and target.data.name
 * attribute, like the single elements in the arrays generated by
 * d3.hierarchy.links().
 * @return {string} The source name and target name, pasted together by a '-'.
 **/
function link_id_fun(d) {
  return d.source.data.name + "-" + d.target.data.name;
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
    "id": function(d) { return d.data.name; },
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
    "id": function(d) { return d.data.name; },
    "text": function(d) { return d.data.name; },
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
