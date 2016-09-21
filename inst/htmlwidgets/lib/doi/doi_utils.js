/**
* Functions to calculate degree-of-interest related quantities. We
* are following http://vis.stanford.edu/papers/doitrees-revisited
**/

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
  return new DoiTreeInternal(tree_json, 0);
}

function TreeInternal(tree_json, depth) {
  this.filter_tree = filter_tree;
  this.contains_node = contains_node;
  this.get_attr_array = get_attr_array;

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

function DoiTreeInternal(tree_json, depth) {
  this.doi = null;
  this.set_tree_fisheye = set_tree_fisheye;
  this.filter_doi = filter_doi;
  this.set_doi = set_doi;

  this.filter_tree = filter_tree;
  this.contains_node = contains_node;
  this.get_attr_array = get_attr_array;

  this.name = tree_json.name[0];
  this.depth = depth;

  if (Object.keys(tree_json).indexOf("children") != -1) {
    this.children = [];
    for (var i = 0; i < tree_json.children.length; i++) {
      var subtree = tree_json.children[i];
      this.children.push(new DoiTreeInternal(subtree, depth + 1));
    }
  }
}

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
function set_doi(focus_node_id, min_doi) {
  var desc_indic = this.contains_node(focus_node_id);
  if (!desc_indic) {
    this.set_tree_fisheye(-1);
  } else {
    this.doi = 0;
    if (Object.keys(this).indexOf("children") != -1) {
      for (var i = 0; i < this.children.length; i++) {
	this.children[i].set_doi(focus_node_id, min_doi);
      }
    }
  }
}

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
 * Get nodes at a certain depth
 *
 * @param {Array} x An array of objects with a .depth attribute
 * @param {int} i The depth to which to filter nodes.
 * @return An array of elements of x at a given depth.
 **/
function filter_depth(x, i) {
  return x.filter(function(d) { return d.depth == i; });
}

/**
 * Define node segmentation given nodes and depths
 *
 * Function that performs the node segmentation required for the
 * TreeBlock algorithm, using an array of nodes and their depths.
 *
 * @param {array} nodes An array of nodes, assumed to contain a .depth
 * field.
 * @param {array} depths An array of integers, giving the depths of
 * the specified nodes.
 * @return {array} nodes The original array, but with a .segment
 * attribute added to each node.
 **/
function set_node_segments(nodes, depths) {
  // set 0 for root [any nodes at depth 0]
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].depth == 0) {
      nodes[i].segment = 0;
    }
  }

  // intentionally skip root, and iterate over depths
  for (var i = 1; i <= d3.max(depths); i++) {
    var parents = filter_depth(nodes, i - 1).map(function(d) { return d.name; });
    var children = filter_depth(nodes, i);

    // iterate over nodes at this depth
    for (var j = 0; j < children.length; j++) {
      var cur_ix = nodes.map(function(d) { return d.name })
	  .indexOf(children[j].name);
      nodes[cur_ix].segment = parents.indexOf(children[j].parent.name);
    }
  }
  return nodes;
}

/**
 * Define a tree segmentation
 *
 * This enumerate blocks [0, 1, ..., n_depth_d] at each depth level,
 * which are used in the TreeBlock algorithm in the DOI paper. At any
 * fixed depth, nodes are assigned to the same block if they have
 * the same parent.
 *
 * This implementation uses a scoping trick. It relies on the fact
 * that modifying the nodes variable [associated with a
 * d3.layout.tree() modifies the tree from which it was created.
 *
 * @param {Object} tree_var A tree structured object, of the kind
 * used by d3's tree and hierarchy functions. This is the object that
 * will be segmented.
 * @return {Object} tree_var The original tree_var object, but with
 * with a new .segment attribute within each subject, giving the
 * segment needed by the TreeBlock algorithm.
 * @reference http://vis.stanford.edu/papers/doitrees-revisited
 **/
function segment_tree(tree_var) {
  var nodes = d3.layout.cluster()
      .nodes(tree_var);
  var depths = nodes.map(function(d) { return d.depth });
  nodes = set_node_segments(nodes, depths);
  return tree_var;
}

/**
 * Get tree node positions
 **/
function get_layout(tree_var, focus_node_id, display_dim, node_size) {
  var nodes = d3.layout.cluster()
      .nodeSize(node_size)
      .nodes(tree_var);
  var focus = nodes.filter(function(d) {
    return d.name == focus_node_id; })[0];
  var x_move = focus.x - display_dim[0] / 2

  for (var i = 0; i < nodes.length; i++) {
    nodes[i].x -= x_move
    nodes[i].y = node_size[1] * (nodes[i].depth - focus.depth) +
      display_dim[1] / 3
  }
  return nodes;
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
function get_layout_bounds(tree_var, focus_node_id, display_dim, node_size) {
  var nodes = get_layout(tree_var, focus_node_id, display_dim, node_size);
  var nodes_pos = {"x": nodes.map(function(d) { return d.x }),
		   "y": nodes.map(function(d) { return d.y })};
  return {"x_min": d3.min(nodes_pos.x), "x_max": d3.max(nodes_pos.x),
	  "y_min": d3.min(nodes_pos.y), "y_max": d3.max(nodes_pos.y)};
}

function get_attr_array(cur_array, attr) {
  cur_array.push(this[attr]);
  if (Object.keys(this).indexOf("children") == -1) {
    return cur_array;
  }

  new_arrays = [];
  for (var i = 0; i < this.children.length; i++) {
    new_arrays.push(
      this.children[i].get_attr_array(cur_array, attr)
    );
  }

  return Array.prototype.concat.apply([], new_arrays);
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

/**
 * Filter away nodes unassociated with a DOI
 **/
function filter_doi(min_doi) {
  values = {
    "value": this.get_attr_array([], "doi"),
    "unit": this.get_attr_array([], "name")
  };

  console.log(values);
  this.filter_tree(values, min_doi);
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
function filter_block(tree_var, depth, segment) {
  if (tree_var.depth == depth && tree_var.segment == segment) {
    return;
  }

  if (Object.keys(tree_var).indexOf("children") != -1) {
    var subtree = []
    for (var i = 0; i < tree_var.children.length; i++) {
      var filtered = filter_block(tree_var.children[i], depth, segment);
      if (typeof filtered != "undefined") {
	subtree.push(filtered);
      }
    }
    tree_var.children = subtree;
  }
  return tree_var;
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
function get_block_dois(tree_var) {
  var nodes = d3.layout.cluster()
      .nodes(tree_var);

  var block_dois = {};
  unique_depths = _.uniq(nodes.map(function(d) { return d.depth }));

  // initialize structure to store dois
  for (var i = 0; i < unique_depths.length; i++) {
    block_dois[i] = {}; // should this be block_dois[unique_depths[i]]?
    cur_nodes = nodes.filter(function(d) { return d.depth == i });
    unique_segments = _.uniq(cur_nodes.map(function(d) { return d.segment; }));
    for (var j = 0; j < unique_segments.length; j++) {
      block_dois[unique_depths[i]][unique_segments[j]] = [];
    }
  }

  // fill in actual values
  for (var i = 0; i < nodes.length; i++) {
    cur_depth = nodes[i].depth
    cur_segment = nodes[i].segment
    block_dois[cur_depth][cur_segment].push(nodes[i].doi);
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
function average_block_dois(tree_var) {
  var block_dois = get_block_dois(tree_var);
  var averages_values = [],
      averages_segments = [],
      averages_depths = [];

  var depths = Object.keys(block_dois);
  for (var i = 0; i < depths.length; i++) {
    var segments = Object.keys(block_dois[i]);
    for (var j = 0; j < segments.length; j++) {
      averages_depths.push(depths[i])
      averages_segments.push(segments[j])
      averages_values.push(d3.mean(block_dois[depths[i]][segments[j]]));
    }
  }

  return {"depths": averages_depths,
	  "segments": averages_segments,
	  "values": averages_values};
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
function trim_width(tree_var, focus_node_id, display_dim, node_size) {
  var average_dois = average_block_dois(tree_var);
  var sorted_dois = average_dois.values
      .concat()
      .sort(function(a, b) { return a - b; });
  sorted_dois = _.uniq(sorted_dois); // maybe uniquing should go before sorting?

  // iterate over DOIs, starting with the smallest
  for (var i = 0; i < sorted_dois.length; i++) {
    cur_bounds = get_layout_bounds(tree_var, focus_node_id,
				   display_dim, node_size);
    if (cur_bounds.x_max < display_dim[0] & cur_bounds.x_min > 0) {
      break;
    }

    // find all blocks with the current DOI value
    for (var j = 0; j < average_dois.values.length; j++) {
      if (average_dois.values[j] == sorted_dois[i]) {
	tree_var = filter_block(tree_var, average_dois.depths[j], average_dois.segments[j]);
      }
    }

  }
  return tree_var;
}

/**
 * Trim the height of the tree, according to DOI
 *
 * probably should just remove this function, or at least raise an
 * implementation error
 * This is not implemented yet. It's not strictly necessary, if we
 * allow panning and give breadcrumbs.
 **/
function trim_height(tree_var) {
  return tree_var;
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
function tree_block(tree_var0, focus_node_id, min_doi, display_dim, node_size) {
  var tree_var = jQuery.extend(true, {}, tree_var0);
  tree_var = set_doi(tree_var, focus_node_id, min_doi);
  tree_var = filter_doi(tree_var, min_doi);
  tree_var = segment_tree(tree_var);

  var cur_bounds = get_layout_bounds(tree_var, focus_node_id,
				     display_dim, node_size);
  if (cur_bounds.x_min < 0 || cur_bounds.x_max > display_dim[0]) {
    tree_var = trim_width(tree_var, focus_node_id, display_dim, node_size);
  }
  if (cur_bounds.y_min < 0 || cur_bounds.y_max > display_dim[1]) {
    tree_var = trim_height(tree_var, display_dim, node_size);
  }

  var nodes = get_layout(tree_var, focus_node_id, display_dim, node_size);
  return {"tree_var": tree_var, "nodes": nodes}
}

// where are the comments??

function get_ancestors(tree_var, node_id, ancestors) {
  // this seems pretty roundabout. Is there no way to traverse the tree upwards?
  if(contains_node(tree_var, node_id)) {
    ancestors.push(tree_var.name);
  } else {
    return;
  }

  if (typeof tree_var.children != "undefined") {
    for (var i = 0; i < tree_var.children.length; i++) {
      var next_ancestors = get_ancestors(tree_var.children[i], node_id, ancestors);
      if (typeof next_ancestors != "undefined") {
	ancestors.concat(next_ancestors);
      }
    }
  }
  return ancestors;
}

function link_id_fun(d) {
  return d.source.name + "-" + d.target.name;
}

function get_matching_subarray(values, categories, to_match) {
  var matched_values = [];
  for(var i = 0; i < values.length; i++) {
    if (categories[i] == to_match) {
      matched_values.push(values[i]);
    }
  }
  return matched_values;
}
