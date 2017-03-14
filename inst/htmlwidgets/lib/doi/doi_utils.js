/*******************************************************************************
* @fileoverview Functions for calculating degree-of-interest related quantities.
*     We are following http://vis.stanford.edu/papers/doitrees-revisited
* @see_also doi_update.js
*
* @author kriss1@stanford.edu
*******************************************************************************/

/*******************************************************************************
* DOI-Tree related objects
*******************************************************************************/

/**
 * Construct a Tree object
 *
 * Interface to a class for constructing tree objects. This creates methods that
 * are useful for handling tree-structured JSON objects.
 *
 * @param tree_json {object} A nested object that has, at each level, attributes
 *     called "id" giving the name of the specified node and "children" giving
 *     an array containing further tree objects.
 * @return {TreeInternal} A TreeInternal object initialized to depth zero. The
 *     main difference is that this object now includes various methodos for
 *     manipulating tree structures.
 * @constructor
 */
function Tree(tree_json) {
  return new TreeInternal(tree_json, 0);
}

/**
 * Define a DoiTree object
 * @param tree_json {object} A nested object that has, at each level, attributes
 *     called "id" giving the name of the specified node and "children" giving
 *     an array containing further tree objects.
 * @return {DoiTreeInternal} A DoiTreeInternal object initialized to depth zero
 *     (and with no parents). The main difference is that this object now
 *     includes various methods for manipulating tree structures.
 * @constructor
 **/
function DoiTree(tree_json) {
  return new DoiTreeInternal(tree_json, 0, "none");
}

/**
 * Construct a TreeInternal object
 *
 * @param tree_json {object} A nested object that has, at each level, attributes
 *     called "id" giving the name of the specified node and "children" giving
 *     an array containing further tree objects.
 * @param depth {int} The current depth of the node from which tree_json is
 *     descended from. This is needed for recursively increasing the depth of
 *     given nodes.
 * @return null
 * @defines A class that adds new methods for navigating / filtering the
 *     original tree_json object.
 **/
function TreeInternal(tree_json, depth) {
  this.get_subtree = get_subtree;
  this.filter_tree = filter_tree;
  this.contains_node = contains_node;
  this.contains_partial_match = contains_partial_match;
  this.get_attr_array = get_attr_array;
  this.get_layout = get_layout;
  this.get_layout_bounds = get_layout_bounds;

  this.id = tree_json.id;
  this.depth = depth;
  if (Object.keys(tree_json).indexOf("children") != -1) {
    this.children = [];
    for (var i = 0; i < tree_json.children.length; i++) {
      var subtree = tree_json.children[i];
      this.children.push(new TreeInternal(subtree, depth + 1));
    }
  }
}

/**
 * Construct a DoiTreeInternal object
 *
 * @param tree_json {object} A nested object that has, at each level, attributes
 *     called "id" giving the name of the specified node and "children" giving
 *     an array containing further tree objects.
 * @param depth {int} The current depth of the node from which tree_json is
 *     descended from. This is needed for recursively increasing the depth of
 *     given nodes.
 * @param parent {string} The name of the parent node in the DOI tree. Used for
 *     pointing to parents when doing TreeBlock filtering.
 * @return null
 * @defines A class that adds new methods for performing DOI calculations on the
 *     original tree_json object.
 **/
function DoiTreeInternal(tree_json, depth, parent) {
  this.doi = null;
  this.segment = parent;
  this.set_tree_fisheye = set_tree_fisheye;
  this.set_doi = set_doi;
  this.get_block_dois = get_block_dois;
  this.trim_children = trim_children;
  this.trim_width = trim_width;
  this.filter_block = filter_block;
  this.tree_block = tree_block;

  this.get_subtree = get_subtree;
  this.filter_tree = filter_tree;
  this.contains_node = contains_node;
  this.contains_partial_match = contains_partial_match;
  this.get_attr_array = get_attr_array;
  this.get_layout = get_layout;
  this.get_layout_bounds = get_layout_bounds;

  this.id = tree_json.id;
  this.depth = depth;

  if (Object.keys(tree_json).indexOf("children") != -1) {
    this.children = [];
    for (var i = 0; i < tree_json.children.length; i++) {
      var subtree = tree_json.children[i];
      this.children.push(new DoiTreeInternal(subtree, depth + 1, this.id));
    }
  }
}

/*******************************************************************************
* Methods for Tree and DOITree objects
*******************************************************************************/

/**
 * Check whether a Tree / DoiTree contains a node with a specified id
 *
 * This defines a method for Tree and DoiTree objects. It expects the.ids
 * .id" and "children" for each node in the hierarchy.
 *
 * @param {string} node_id The id to search the tree for.
 * @return {bool} true or false, depending on whether the node_id was
 *     found in the tree.
 **/
function contains_node(node_id) {
  if (this.id == node_id) {
    return true;
  }

  if (Object.keys(this).indexOf("children") == -1) {
    return false;
  }

  var children_indic = [];
  for (var i = 0; i < this.children.length; i++) {
    var cur_indic = this.children[i].contains_node(node_id);
    children_indic.push(cur_indic);
  }
  return children_indic.some(function(x) { return x; });
}


/**
 * Create a TreeInternal corresponding to a subtree
 *
 * This defines a method for Tree and DoiTree objects. It expects the .ids"
 * and "children" for each node in the hierarchy.
 *
 * @param {string} new_root The.id of the root in the subtree for the Tree /
 * DoiTree object to return.
 * @return {Tree / DoiTree} The subtree in the original object corresponding
 *     with the specified "new_root" as the root node.
 **/
function get_subtree(new_root) {
  if (this.id == new_root) {
    return this;
  }

  var subtrees = this.children;
  for (var i = 0; i < subtrees.length; i++) {
    if (subtrees[i].contains_node(new_root)) {
      return subtrees[i].get_subtree(new_root);
    }
  }
}

/**
 * Check whether a Tree / DoiTree contains a node partially matching an id
 *
 * This defines a method for Tree and DoiTree objects. It expects the.ids
 * .id" and "children" for each node in the hierarchy.
 *
 * @param {string} search_str The string to scan across all node ids looking for
 *     a partial match.
 * @return {bool} true or false, depending on whether the node_id was
 *     found in the tree.
 **/
function contains_partial_match(search_str) {
  var match_ix = this.id.toLowerCase().search(
    search_str.toLowerCase()
  );

  if (match_ix != -1) {
    return true;
  }

  if (Object.keys(this).indexOf("children") == -1) {
    return false;
  }

  var children_indic = [];
  for (var i = 0; i < this.children.length; i++) {
    var cur_indic = this.children[i].contains_partial_match(search_str);
    children_indic.push(cur_indic);
  }
  return children_indic.some(function(x) { return x; });
}

/**
 * Unnest the attributes in a nested Tree / DoiTree object
 *
 * This defines a method for Tree and DoiTree objects. It expects the.ids
 * .id" and "children" for each node in the hierarchy.
 *
 * @param {string} attr The.id of the attribute at each node in the hierarchy
 *     whose value we want to extract and put into a flat list.
 * @return {array} all_attrs An array containing the flattened collection of
 *     tree values for the specified attribute.
 **/
function get_attr_array(attr) {
  if (Object.keys(this).indexOf("children") == -1) {
    return [this[attr]];
  }

  all_attrs = [this[attr]];
  for (var i = 0; i < this.children.length; i++) {
    all_attrs = all_attrs.concat(
      this.children[i].get_attr_array(attr)
    );
  }

  return all_attrs;
}

/**
 * Filter a tree based on values in an external object
 *
 * This defines a method for Tree and DoiTree objects. It expects the.ids
 * .id" and "children" for each node in the hierarchy.
 *
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The values with which to filter Tree nodes.
 *       - unit {array of string} The node.ids associated with values.
 *     The tree will be pruned below any nodes whose values are below the
 *     threhsold. Note that the same unit.id can appear in multiple rows. In
 *     this case the unit will only be trimmed if the mean of the associated
 *     values is above the threshold.
 * @param {float} threshold The threhsold used for determining whether a subtree
 *     is included in the result.
 * @return null
 * @side-effects Prunes the tree below any nodes whose associated values are
 *     below the specified threshold.
 **/
function filter_tree(values, threshold) {
  // if we're at a leaf, return
  if (Object.keys(this).indexOf("children") == -1) {
    return;
  }

  var subtrees = this.children;
  var filtered_subtrees = [];

  for (var i = 0; i < subtrees.length; i++) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      subtrees[i].id
    );

    if (d3.mean(cur_values) >= threshold) {
      subtrees[i].filter_tree(values, threshold);
      filtered_subtrees.push(subtrees[i]);
    }
  }

  if (filtered_subtrees.length > 0) {
    this.children = filtered_subtrees;
  } else {
    delete this.children;
  }
}

/*******************************************************************************
* DOI-tree specific methods
*******************************************************************************/

/**
 * Compute the DOI of a tree, given a specific single focus node
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * Calculates the DOI according to
 * http://vis.stanford.edu/papers/doitrees-revisited
 *
 * @param {Object} tree_var A tree structured object, of the kind created by
 *     d3's tree and hierarchy functions.
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param {float} min_doi The minimum doi at which point we stop traversing the
 *     tree. This can save computation when navigating very large trees.
 * @return null
 * @side-effect Updates the input tree_var, so that the doi distribution input
 *     in the .doi fields for each node reflect the new focus node.
 * @example
 * // using tax_tree defined by src/processing/prepare_phylo.R
 * set_doi(tax_tree, "G:Ruminococcus", -2)
 **/
function set_doi(focus_node_id) {
  var desc_indic = this.contains_node(focus_node_id);
  if (!desc_indic) {
    this.set_tree_fisheye(-1);
  } else {
    this.doi = 0;
    if (Object.keys(this).indexOf("children") != -1) {
      for (var i = 0; i < this.children.length; i++) {
	this.children[i].set_doi(focus_node_id);
      }
    }
  }
}

/**
 * Compute fisheye distribution over a tree
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * Assigns doi argument to current node, and doi - 1 to immediate
 * children, and doi - 2 to second order children, ..., until
 * it reaches min_doi
 *
 * @param {Object} tree_var A tree structured object, of the kind created by
 *     d3's tree and hierarchy functions.
 * @param {float} doi The doi for the top node in the tree.
 * @param {float} min_doi The minimum doi at which point we stop traversing the
 *     tree. This can save computation when navigating very large trees.
 * @return null
 * @side-effects Updates the input tree_var, but with the fisheye distribution
 *     set as the .doi field in each node.
 * @example
 * test_doi = set_doi(tax_tree, "K:Bacteria", -10)
 **/
function set_tree_fisheye(doi) {
  this.doi = doi;
  if (Object.keys(this).indexOf("children") != -1) {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].set_tree_fisheye(doi - 1);
    }
  }
}

/**
 * Get tree node positions
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param display_dim {length 2 array of float} An array giving the width and
 *     height of the desired tree layout, in pixels.
 * @param node_size {float} The minimum space to be allocated to each node, in
 *     pixels, if we were drawing a square with this width / height around each
 *     node.
 * @return layout {array} An array containing and x and y coordinates for each
 *     node in the tree.
 **/
function get_layout(focus_node_id, display_dim, node_size) {
  var hierarchy = d3.hierarchy(this);
  var cluster = d3.tree()
      .size(display_dim)
      .nodeSize(node_size);

  var layout = cluster(hierarchy);
  var nodes = layout.descendants();

  var focus = nodes.filter(function(d) {
    return d.data.id == focus_node_id;
  })[0];

  var x_move = 0.5 * display_dim[0] - focus.x;
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].x += x_move;
    nodes[i].y = node_size[1] * (nodes[i].depth - focus.depth) +
      display_dim[1] / 3.0;
  }
  return layout;
}

/**
 * Get the breadth and width associated with a tree + node_size
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * During the tree-blocking algorithm, we repeatedly query for the
 * width and breadth of successive trimmings of the tree. This
 * function calculates the space that a particular trimmed version of
 * the tree takes up. Note that it uses a dendrogram layout, instead
 * of a reingold-tilford layout [d3.layout.tree()], because the
 * reingold-tilford layout width does not change until you remove full
 * layers.
 *
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param display_dim {length 2 array of float} An array giving the width and
 *     height of the desired tree layout, in pixels.
 * @param node_size {float} The minimum space to be allocated to each node, in
 *     pixels, if we were drawing a square with this width / height around each
 *     node.
 * @return {array} A length 2 array giving the width and height of
 *     result tree.
 **/
function get_layout_bounds(focus_node_id, display_dim, node_size) {
  var nodes = this.get_layout(
    focus_node_id,
    display_dim,
    node_size
  ).descendants();
  var nodes_pos = {
    "x": nodes.map(function(d) { return d.x; }),
    "y": nodes.map(function(d) { return d.y; })
  };

  return {
    "x_min": d3.min(nodes_pos.x),
    "x_max": d3.max(nodes_pos.x),
    "y_min": d3.min(nodes_pos.y),
    "y_max": d3.max(nodes_pos.y)
  };
}

/**
 * Filter nodes within a single tree block
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * The tree-blocking algorithm requires filtering away blocks of
 * nodes, according to their degree-of-interest. This function filters
 * away a single block from the input tree structure, as specified by
 * the depth and segment position of the block (see tree_segment())
 *
 * @param {int} depth The depth in the tree to filter away.
 * @param {int} segment The segment at the specified depth to filter
 * away.
 * @return {Object} tree_var The original tree_var object, but with
 * the single specified block filtered out.
 **/
function filter_block(depth, segment) {
  if (Object.keys(this).indexOf("children") == -1) {
    return;
  }

  var subtrees = this.children;
  var filtered_subtrees = [];

  for (var i = 0; i < subtrees.length; i++) {
    if (subtrees[i].depth != depth || subtrees[i].segment != segment) {
      subtrees[i].filter_block(depth, segment);
      filtered_subtrees.push(subtrees[i]);
    }
  }

  if (filtered_subtrees.length > 0) {
    this.children = filtered_subtrees;
  } else {
    delete this.children;
  }
}

/**
 * Rearrange dois along trees into blocks
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * For the tree-blocking algorithm, it is convenient to store the DOIs
 * into a depth x segment object.
 *
 * @return {Object} block_dois An object keyed by depths. At each
 * depth, the value is another object, keyed by segments. For each
 * block-segment combination, an array of DOIs for that block in the
 * tree is returned.
 **/
function get_block_dois() {
  var dois = this.get_attr_array( "doi");
  var depths = this.get_attr_array("depth");
  var segments = this.get_attr_array("segment");

  var block_dois = {};
  for (var i = 0; i < dois.length; i++) {

    // initialize if doesn't already exist
    if (Object.keys(block_dois).indexOf(depths[i].toString()) == -1) {
      block_dois[depths[i]] = {};
    }

    if (Object.keys(block_dois[depths[i]]).indexOf(segments[i].toString()) == -1) {
      block_dois[depths[i]][segments[i]] = [];
    }

    block_dois[depths[i]][segments[i]].push(dois[i]);
  }

  return block_dois;
}

/**
 * Compute the average DOI in each block
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * To summarize the importance of displaying any particular block, it is useful
 * to be able to retrieve the average doi within blocks.
 *
 * @param {Object} block_dois An object keyed by depths. At each depth, the
 *     value is another object, keyed by segments. For each block-segment
 *     combination, an array of DOIs for that block in the tree is returned.
 * @return {Object} An object with the average dois for each block contained in
 *     a .values element. The .depths and .segments blocks specify the block and
 *     segment indices associated with each average doi.
 **/
function average_block_dois(block_dois) {
  var average_dois = {};

  var depths = Object.keys(block_dois);
  for (var i = 0; i < depths.length; i++) {
    average_dois[depths[i]] = {};

    var segments = Object.keys(block_dois[i]);
    for (var j = 0; j < segments.length; j++) {

      average_dois[depths[i]][segments[j]] = d3.mean(
	block_dois[depths[i]][segments[j]]
      );

    }
  }

  return average_dois;
}

/**
 * Remove some children when many sibling subtrees
 *
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @return null
 * @side-effects If a node is not an ancestor of a focus node (or the actual
 *     focus node), all but the first two children subtrees will be pruned.
 **/
function trim_children(focus_node_id) {
  if (Object.keys(this).indexOf("children") == -1 || this.id == focus_node_id) {
    return;
  }

  var subtrees = this.children;
  var filtered_subtrees = [];
  for (var i = 0; i < subtrees.length; i++) {
    subtrees[i].trim_children(focus_node_id);
    if (i < 2 || subtrees[i].contains_node(focus_node_id)) {
      filtered_subtrees.push(subtrees[i]);
    }
  }
  this.children = filtered_subtrees;
}

/**
 * Trim the width of a tree until it fits within a certain width
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * This implements the breadth-trimming strategy described in the
 * DOI revisited paper (there are some differences in details). The
 * specific strategy here is to sort blocks (which we take to be
 * groups of sibling nodes) according to DOI, and filter them from
 * lowest to highest DOI, until the width of the resulting layout is
 * below the specified max_width.
 *
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param display_dim {length 2 array of float} An array giving the width and
 *     height of the desired tree layout, in pixels.
 * @param node_size {float} The minimum space to be allocated to each node, in
 *     pixels, if we were drawing a square with this width / height around each
 *     node.
 * @reference http://vis.stanford.edu/files/2004-DOITree-AVI.pdf
 **/
function trim_width(focus_node_id, display_dim, node_size) {
  var block_dois = this.get_block_dois();
  var average_dois = flatten_nested_object(
    average_block_dois(block_dois)
  );
  var sorted_dois = unique_average_dois(average_dois);

  // iterate over DOIs, starting with the smallest
  for (var i = 0; i < sorted_dois.length; i++) {
    cur_bounds = this.get_layout_bounds(focus_node_id, display_dim, node_size);

    if (cur_bounds.x_max <= display_dim[0] & cur_bounds.x_min >= 0) {
      break;
    }

    // find all blocks with the current DOI value
    for (var j = 0; j < average_dois.length; j++) {
      if (average_dois[j].value == sorted_dois[i]) {
	this.filter_block(
	  average_dois[j].outer_key,
	  average_dois[j].inner_key
	);
      }
    }
  }
}

/**
 * Wrapper to perform overall tree blocking algorithm
 *
 * This defines a method for DoiTree objects. It expects the.ids .id" and
 * "children" for each node in the hierarchy.
 *
 * @param {string} focus_node_id A string specifying the .id field in the
 *     object that will be considered the "focus" node, around which to set the
 *     doi distibution.
 * @param display_dim {length 2 array of float} An array giving the width and
 *     height of the desired tree layout, in pixels.
 * @param node_size {float} The minimum space to be allocated to each node, in
 *     pixels, if we were drawing a square with this width / height around each
 *     node.
 * @return The layout (node x and y positions) associated with the TreeBlock
 *     filtered tree.
 **/
function tree_block(focus_node_id, display_dim, node_size) {
  this.set_doi(focus_node_id);
  this.trim_children(focus_node_id);
  this.trim_width(focus_node_id, display_dim, node_size);
  return this.get_layout(focus_node_id, display_dim, node_size);
}

/*******************************************************************************
 * Styling / Positioning for DOI trees
 ******************************************************************************/

/**
 * Specify attribute functions for nodes in DOI tree
 *
 * This specializes the template in node_attr_defaults [d3_utils.js] for drawing
 * DOI trees.
 *
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The values associated with tree nodes. This
 *         determines the size of each node.
 *       - unit {array of string} The node.ids associated with values.
 * @param {Object of d3.scales} scales An object with different scales for size
 *     and fill, used when drawing the nodes. Must have keys "size" and "fill".
 * @param {DoiTree} tree_obj The DoiTree that we are drawing. This is used for
 *     searching partial matches among descendants (to determine whether to
 *     highlight a node or not).
 * @param {string} search_str The string to scan across all node ids looking for
 *     a partial match.
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 circle selection's .attr() to give styling /
 *     positioning for DoiTrees.
 **/
function doi_node_attrs(values, scales, tree_obj, search_strs) {
  var attrs = node_attr_defaults();

  // fill and radius
  attrs.fill = function(d) { return scales.fill(d.data.doi); };
  attrs.r = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.id
    );
    return scales.size(d3.mean(cur_values));
  };

  // stroke and stroke-width
  attrs.stroke = "#D66F62";
  attrs["stroke-width"] = function(d) {
    var cur_tree = tree_obj.get_subtree(d.data.id);
    for (var i = 0; i < search_strs.length; i++) {
      if (search_strs[i] !== null &&
	  search_strs[i] !== "" &&
	  cur_tree.contains_partial_match(search_strs[i])) {

	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.data.id
	);
	var width = 0.05 * scales.size(d3.mean(cur_values));
	if (width < 1.5) {
	  return 1.5;
	}
	return width;
      }
    }
    return 0;
  };

  return attrs;
}

/**
 * Specify attribute functions for links in DOI tree
 *
 * This specializes the template in link_attr_defaults [d3_utils.js] for drawing
 * DOI trees.
 *
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The values associated with tree nodes. This
 *         determines the size of each node.
 *       - unit {array of string} The node.ids associated with values.
 * @param scales {Object of d3.scales} An object with different scales for size
 *     and fill, used when drawing the nodes. Must have keys "size" and "fill".
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 path selection's .attr() to give styling /
 *     positioning for DoiTrees.
 **/
function doi_link_attrs(values, scales) {
  var attrs = link_attr_defaults();

  attrs.stroke = function(d) {
    return scales.fill(d.target.data.doi);
  };

  attrs["stroke-width"] = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.target.data.id
    );
    return scales.size(d3.mean(cur_values));
  };

  return attrs;
}

/**
 * Specify attribute functions for highlighted links in DOI tree
 *
 * This specializes the template in link_attr_defaults [d3_utils.js] for drawing
 * highlighted links in DOI trees.
 *
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The values associated with tree nodes. This
 *         determines the size of each node.
 *       - unit {array of string} The node.ids associated with values.
 * @param scales {Object of d3.scales} An object with different scales for size
 *     and fill, used when drawing the nodes. Must have keys "size" and "fill".
 * @param tree_obj {DoiTree} The DoiTree that we are drawing. This is used for
 *     searching partial matches among descendants (to determine whether to
 *     highlight a link or not).
 * @param {string} search_str The string to scan across all node ids looking for
 *     a partial match.
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 path selection's .attr() to give styling /
 *     positioning for DoiTrees.
 **/
function doi_highlight_link_attrs(values, scales, tree_obj, search_strs) {
  var attrs = link_attr_defaults();

  attrs["stroke-width"] = function(d) {
    var cur_tree = tree_obj.get_subtree(d.target.data.id);
    for (var i = 0; i < search_strs.length; i++) {
      if (search_strs[i] !== null &&
	  search_strs[i] !== "" &&
	  cur_tree.contains_partial_match(search_strs[i])) {

	var cur_values = get_matching_subarray(
	  values.value,
	  values.unit,
	  d.target.data.id
	);
	return 1.3 * scales.size(d3.mean(cur_values));
      }
    }

    return 0;
  };

  attrs.stroke = function(d) { return "#D66F62";};
  return attrs;
}

/**
 * Specify attribute functions for text in DOI tree
 *
 * This specializes the template in text_attr_defaults [d3_utils.js] for drawing
 * text on DOI trees.
 *
 * @param {object} values An object with two subarrays,
 *       - value {array of float} The values associated with tree nodes. This
 *         determines the size of each node.
 *       - unit {array of string} The node.ids associated with values.
 * @param scales {Object of d3.scales} An object with different scales for size
 *     and fill, used when drawing the nodes. Must have keys "size" and "fill".
 * @return {dictionary of functions} A dictionary containing functions that can
 *     be directly input to a d3 text selection's .attr() to give styling /
 *     positioning for text on DoiTrees.
 **/
function doi_text_attrs(values, scales, style_opts) {
  var attrs = text_attr_defaults();

  attrs.x = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.id
    );

    return d.x + style_opts.text_offset * Math.sqrt(scales.size(d3.mean(cur_values)));
  };

  attrs.y = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.id
    );

    return d.y - style_opts.text_offset * Math.sqrt(scales.size(d3.mean(cur_values)));
  };

  attrs.fill = function(d) {
	return scales.fill(d.data.doi);
  };

  attrs.text = function(d) {
    if (d.data.doi >= -style_opts.text_display_neighbors) {
      return d.data.id;
    }
  };

  attrs["font-size"] = function(d) {
    if (d.data.doi === 0) {
      return style_opts.focus_font_size;
    }
    return style_opts.font_size;
  };

  return attrs;
}

/*******************************************************************************
 * Miscellaneous helper functions
 ******************************************************************************/

/**
 * Get values at indices specified by categories array
 *
 * @param {array} values The array to filter.
 * @param {array} categories The array to use for filtering.
 * @param {string or float} to_match The value categories[i] must be in order
 *     for values[i] to be included in the matched subarray.
 * @return {array} matched_values The subarray of values at indices where
 *     categories is equal to to_match.
 **/
function get_matching_subarray(values, categories, to_match) {
  var matched_values = [];
  for(var i = 0; i < values.length; i++) {
    if (categories[i] == to_match) {
      matched_values.push(values[i]);
    }
  }
  return matched_values;
}

/**
 * Helper to retrieve values in object
 *
 * This only applies to objects with depth two. It is used only for filtering
 * segment-depth objects in the TreeBlock algorithm.
 *
 * @param {Object} obj A depth two object whose values we want to flatten into a
 *     single array.
 * @return {array of objects} values The values in obj as a single array. Each
 *     index has an object with three attributes (outer_key, inner_key, and
 *     value), matching information from the original nesting structure.
 */
function flatten_nested_object(obj) {
  var values = [];

  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    cur_obj = obj[keys[i]];

    cur_keys = Object.keys(cur_obj);
    for (var j = 0; j < cur_keys.length; j++) {
      values.push(
	{
	  "outer_key": keys[i],
	  "inner_key": cur_keys[j],
	  "value": cur_obj[cur_keys[j]]
	}
      );
    }
  }

  return values;
}

/**
 * Shamelessly hide ugly code (get flattened DOIs and sort them)
 *
 * @param {array of objects} flattened_dois The output of flatten_nested_obj().
 * @return The sorted .values fields in the flattened_dois object.
 */
function unique_average_dois(flattened_dois) {
  return d3.set(
    flattened_dois.map(
      function(d) { return d.value; }
    )).values()
    .sort(function(a, b) { return a - b;});
}
