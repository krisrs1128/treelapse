function draw_sankey(elem,
		     width,
		     height,
		     values,
		     tree,
		     focus_node_id,
		     size_max,
		     leaf_width,
		     leaf_height) {
  setup_search(elem);
  setup_background(elem, width, height, "#F7F7F7");
  setup_groups(d3.select("svg"), ["links", "text"]);

  sankey_update(
    width,
    height,
    values,
    tree,
    focus_node_id,
    size_max,
    leaf_width,
    leaf_height
  );
}

function sankey_update(width,
		       height,
		       values,
		       tree,
		       focus_node_id,
		       size_max,
		       leaf_width,
		       leaf_height) {

  function sankey_update_wrapper(x) {
    sankey_update(
      width,
      height,
      values,
      tree,
      x,
      size_max,
      leaf_width,
      leaf_height
    );
  }

  console.log("Focusing on " + focus_node_id);

  // essential DOI algorithm
  var tree_obj = new Tree(tree);
  var doi_tree = new DoiTree(tree);
  doi_tree.set_doi();

  // setup search box
  var node_names = tree_obj.get_attr_array("name");
  $(function() {
    $("#search_box").autocomplete({
      minLength: 0,
      delay: 500,
      source: node_names,
      search: function(event, ui) {
	sankey_update_wrapper(focus_node_id);
      },
      select: function(event, ui) {
	$("#search_box").val(ui.item.label);
	sankey_update_wrapper(focus_node_id);
      }
    });
  });

  var groups = d3.set(values.group).values();
  var scales = {
    "size": d3.scaleLinear()
      .domain([0, d3.max(values.value)])
      .range([0, size_max]),
    "fill": d3.scaleOrdinal(d3.schemeSet3)
      .domain(groups)
  };

  var layout = doi_tree.tree_block(
    focus_node_id,
    [width, height],
    [leaf_width, leaf_height]
  );

  var x_pos = layout.descendants()
      .map(function(d) {
	return {"unit": d.data.name, "x": d.x};
      });

  var edgelist = layout.links()
      .map(function(d) {
	return {
	  "source": d.source.data.name,
	  "target": d.target.data.name
	};
      });

  var centers = {
    "source": edge_centers(x_pos, edgelist, values, scales.size, "source"),
    "target": edge_centers(x_pos, edgelist, values, scales.size, "target")
  };

  for (var i = 0; i < groups.length; i++) {
    selection_update(
      "path",
      d3.select("#links"),
      layout.links(),
      "tree_link_" + groups[i],
      sankey_link_attrs(
	values,
	scales,
	groups[i],
	centers,
	tree_obj,
	$("#search_box").val()
      )
    );
  }

  selection_update(
    "text",
    d3.select("#text"),
    layout.descendants(),
    "tree_text",
    sankey_text_attrs(values, scales)
  );

  d3.selectAll("[class^='tree_link']")
    .on("click", function(d) {
      return sankey_update_wrapper(d.target.data.name);
    });
}
