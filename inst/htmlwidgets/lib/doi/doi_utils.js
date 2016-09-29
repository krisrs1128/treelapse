/*******************************************************************************
* Functions to calculate degree-of-interest related quantities. We
* are following http://vis.stanford.edu/papers/doitrees-revisited
*******************************************************************************/

/*******************************************************************************
* DOI-Tree related objects
*******************************************************************************/

/**
 * Define a "tree" object
 *
 * This adds some useful methods to the hierachy defined by the tree JSON
 * structure.
 */
function Tree(tree_json) {
  return new TreeInternal(tree_json, 0);
}

function DoiTree(tree_json) {
  return new DoiTreeInternal(tree_json, 0, "none");
}

function TreeInternal(tree_json, depth) {
  this.get_subtree = get_subtree;
  this.filter_tree = filter_tree;
  this.contains_node = contains_node;
  this.contains_partial_match = contains_partial_match;
  this.get_attr_array = get_attr_array;
  this.get_layout = get_layout;
  this.get_layout_bounds = get_layout_bounds;

  this.name = tree_json.name[0];
  this.depth = depth;
  if (Object.keys(tree_json).indexOf("children") != -1) {
    this.children = [];
    for (var i = 0; i < tree_json.children.length; i++) {
      var subtree = tree_json.children[i];
      this.children.push(new TreeInternal(subtree, depth + 1));
    }
  }
}

function DoiTreeInternal(tree_json, depth, parent) {
  this.doi = null;
  this.segment = parent;
  this.set_tree_fisheye = set_tree_fisheye;
  this.set_doi = set_doi;
  this.get_block_dois = get_block_dois;
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

  this.name = tree_json.name[0];
  this.depth = depth;

  if (Object.keys(tree_json).indexOf("children") != -1) {
    this.children = [];
    for (var i = 0; i < tree_json.children.length; i++) {
      var subtree = tree_json.children[i];
      this.children.push(new DoiTreeInternal(subtree, depth + 1, this.name));
    }
  }
}

/*******************************************************************************
* General tree methods
*******************************************************************************/

/**
 * Check whether a tree contains a  node of a specified id
 *
 * @param {Object} tree_var The tree sturctured variable that we will
 * containing objects whose .name attribute will be checked to contain
 * the id node_id.
 * @param {string} node_id The id to search the tree for.
 * @return {bool} true or false, depending on whether the node_id was
 * found in the tree.
 **/
function contains_node(node_id) {
  if (this.name == node_id) {
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

function get_subtree(new_root) {
  if (this.name == new_root) {
    return this;
  }

  var subtrees = this.children;
  for (var i = 0; i < subtrees.length; i++) {
    if (subtrees[i].contains_node(new_root)) {
      return subtrees[i].get_subtree(new_root);
    }
  }
}

function contains_partial_match(search_str) {
  var match_ix = this.name.toLowerCase().search(
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
      subtrees[i].name
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
 * Calculates the DOI according to
 * http://vis.stanford.edu/papers/doitrees-revisited
 *
 * @param {Object} tree_var A tree structured object, of the kind created by d3's
 * tree and hierarchy functions.
 * @param {string} focus_node_id A string specifying the .name field in
 * the object that will be considered the "focus" node, around which to
 * set the doi distibution.
 * @param {float} min_doi The minimum doi at which point we stop traversing the
 * tree. This can save computation when navigating very large trees.
 *
 * @return tree_var A copy of the input tree_var, but with the doi
 * distribution input as the .doi field in each node.
 *
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
 * Assigns doi argument to current node, and doi - 1 to immediate
 * children, and doi - 2 to second order children, ..., until
 * it reaches min_doi
 *
 * @param {Object} tree_var A tree structured object, of the kind created by d3's
 * tree and hierarchy functions.
 * @param {float} doi The doi for the top node in the tree.
 * @param {float} min_doi The minimum doi at which point we stop traversing the
 * tree. This can save computation when navigating very large trees.
 * @return A copy of the tree, but with the fisheye distribution set
 * as the .doi field in each node.
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
 **/
function get_layout(focus_node_id, display_dim, node_size) {
  var hierarchy = d3.hierarchy(this);
  var cluster = d3.cluster()
      .size(display_dim)
      .nodeSize(node_size);

  var layout = cluster(hierarchy);
  var nodes = layout.descendants();

  var focus = nodes.filter(function(d) {
    return d.data.name == focus_node_id;
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
 * During the tree-blocking algorithm, we repeatedly query for the
 * width and breadth of successive trimmings of the tree. This
 * function calculates the space that a particular trimmed version of
 * the tree takes up. Note that it uses a dendrogram layout, instead
 * of a reingold-tilford layout [d3.layout.tree()], because the
 * reingold-tilford layout width does not change until you remove full
 * layers.
 *
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions.
 * @param {array} node_size A length 2 array giving the width and
 * height of the rectangle reserved for a single node.
 * @return {array} A length 2 array giving the width and height of
 * result tree.
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
 * The tree-blocking algorithm requires filtering away blocks of
 * nodes, according to their degree-of-interest. This function filters
 * away a single block from the input tree structure, as specified by
 * the depth and segment position of the block (see tree_segment())
 *
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions.
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
 * For the tree-blocking algorithm, it is convenient to store the DOIs
 * into a depth x segment object.
 *
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions. This is assumed to have
 * a "depth" and a "segment" field already included.
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
 * To summarize the importance of displaying any particular block, it
 * is useful to be able to retrieve the average doi within blocks.
 *
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions. This is assumed to have
 * a "depth" and a "segment" field already included.
 * @return {Object} An object with the average dois for each block
 * contained in a .values element. The .depths and .segments blocks
 * specify the block and segment indices associated with each average
 * doi.
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
 * Trim the width of a tree until it fits within a certain width
 *
 * This implements the breadth-trimming strategy described in the
 * DOI revisited paper (there are some differences in details). The
 * specific strategy here is to sort blocks (which we take to be
 * groups of sibling nodes) according to DOI, and filter them from
 * lowest to highest DOI, until the width of the resulting layout is
 * below the specified max_width.
 *
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions.
 * @param max_width The maximum allowed width of the tree layout.
 * @param {array} node_size A length 2 array giving the width and
 * height of the rectangle reserved for a single node.
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
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions.
 * @param
 * @param {string} focus_node_id A string specifying the .name field in
 * the object that will be considered the "focus" node, around which to
 * set the doi distibution.
 * @param {float} min_doi The minimum doi at which point we stop traversing the
 * tree. This can save computation when navigating very large trees.
 * @param {array} node_size A length 2 array giving the width and
 * height of the rectangle reserved for a single node.
 *
 * @return The filtered tree and nodes.
 **/
function tree_block(focus_node_id, display_dim, node_size) {
  this.set_doi(focus_node_id);
  this.trim_width(focus_node_id, display_dim, node_size);
  return this.get_layout(focus_node_id, display_dim, node_size);
}

/*******************************************************************************
 * Miscellaneous helper functions
 ******************************************************************************/

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
 * This only applies to objects with depth two.
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
 * Shamelessly hide ugly code
 */
function unique_average_dois(flattened_dois) {
  return d3.set(
    flattened_dois.map(
      function(d) { return d.value; }
    )).values()
    .sort(function(a, b) { return a - b;});
}

function doi_node_attrs(values, scales, tree_obj, search_str) {
  var attrs = node_attr_defaults();

  attrs.fill = function(d) { return scales.fill(d.data.doi); };

  attrs.r = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.name
    );
    return scales.size(d3.mean(cur_values));
  };

  attrs.stroke = function(d) {
    var cur_tree = tree_obj.get_subtree(d.data.name);
    if (search_str !== "" & cur_tree.contains_partial_match(search_str)) {
      return "#D66F62";
    }
  };
  attrs.stroke_width = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.data.name
    );
    var width = 0.05 * scales.size(d3.mean(cur_values));
    if (width < 1.5) {
      return 1.5;
    }
    return width;
  };

  return attrs;
}

function doi_link_attrs(values, scales, tree_obj, search_str) {
  var attrs = link_attr_defaults();
  attrs.stroke_width = function(d) {
    var cur_values = get_matching_subarray(
      values.value,
      values.unit,
      d.target.data.name
    );
    return scales.size(d3.mean(cur_values));
  };

  attrs.stroke = function(d) {
    return scales.fill(d.target.data.doi);
  };
  return attrs;
}
