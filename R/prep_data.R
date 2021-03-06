#' @title Generate a nested list representing a tree structure
#' @description This representation is easily converted to the json required by
#' d3 by using toJSON in the jsonlite package.
#' @param el [data.frame] A data.frame with names "parent" and "child", giving
#' the edgelist for the tree structure to generate. Columns called "length" or
#' "depth" will also be accepted and stored in the resulting list.
#' @param cur_node The name of the root node in the edgelist, from which to
#' start the recursive descent.
#' @return [list] A nested list whose structure reflects the edgelist in el. At
#' each level, "name" is a character string specifying the name of the root in
#' the subtree and children is a list with the same structure as the overall
#' tree. If "length" or "depth" are provided in "el", this information is stored
#' along with "name".
#' @examples
#' el <- data.frame(
#'   parent = c("1", "1", "2", "2", "3", "3"),
#'   child = c("2", "3", "4", "5", "6", "7"),
#'   stringsAsFactors = FALSE
#' )
#' tree_json(el, "1")
#' @export
tree_json <- function(el, cur_node) {
  stopifnot(
    all(c("child", "parent") %in% colnames(el))
  )

  cur_ix <- which(el$parent == cur_node)
  children <- el[cur_ix, "child"]

  if (length(children) == 0) {
    res <- list("name" = cur_node)
  } else {
    sublist <- list()
    for (i in seq_along(children)) {
      sublist[[i]] <- tree_json(el, children[i])
      sublist[[i]]$length <- el[cur_ix[i], "length"]
      sublist[[i]]$depth <- el[cur_ix[i], "depth"]
    }
    res <- list(
      "name" = cur_node,
      "children" = sublist
    )
  }
  res
}

#' @title Get Edgelist from Tax Table
#' @description This is a helper to construct edgelists using tax tables. This
#' is useful when we want to visualize the tree associated with a taxonomy
#' (which can have more than two children, unlike the phylos that usually come
#' with a phyloseq object).
#'
#' @param taxa [matrix] A matrix (with rownames) whose first column represents
#' the highest level in the hierarchy, next level is next depth, etc, and whose
#' rownames represent the finest level name (e.g., OTU in the phyloseq context).
#' NAs can be used to represent that finer level information is not available;
#' in this case, the tree skips these levels in the tree.
#' @return el [data.frame] A two column data.frame (parent & child) giving a
#' list of edges associated with the taxonomic tree.
#' @examples
#' taxa <- matrix(
#'   c("1", "2", "1", NA, "1", NA, "1", "6"),
#'     nrow = 4,
#'     byrow = TRUE,
#'     dimnames = list(c("3", "4", "5", "7"),
#'                     c("depth_1", "depth_2"))
#'    )
#' taxa_edgelist(taxa)
#' @importFrom dplyr arrange
#' @importFrom magrittr %>%
#' @importFrom zoo na.locf
#' @export
taxa_edgelist <- function(taxa) {
  taxa <- cbind(taxa, OTU = rownames(taxa))

  for (i in seq_len(nrow(taxa))) {
    taxa[i, ] <- na.locf(taxa[i, ])
  }

  el  <- list()
  for (j in seq_len(ncol(taxa) - 1)) {
    cur_el  <- data.table(
      parent = taxa[, j],
      child = taxa[, j + 1]
    )

    # discard self-loops introduced by na.locf
    cur_el <- cur_el[cur_el$parent != cur_el$child, ]
    el[[j]] <- unique(cur_el)
  }

  el %>%
    rbindlist() %>%
    arrange(parent, child) %>%
    as.matrix()
}

#' @title Apply a function recursively through the tree
#'
#' @description Given a value associated with each tip in a tree, this
#' calculates, for each internal node, the sum across all tips that descend from
#' it.
#' @param el [character matrix] The edgelist specifying the tree structure.
#' The first column are character names for the parents, the second are
#' children.
#' @param values [named vector] Tip values on which to aggregate. The names must
#' be the same names as in el.
#' @param f [function] The function to apply to each group of children values.
#' @importFrom magrittr %>%
#' @importFrom data.table data.table
#' @examples
#' el <- data.frame(
#'   parent = c("1", "1","2", "2", "2"),
#'   child = c("2", "7", "3", "4", "5"),
#'   stringsAsFactors = FALSE
#' )
#' counts  <- c(
#'   "7" = 10,
#'   "3" = 2,
#'   "4" = 5,
#'   "5" = 1
#' )
#' tree_sum(el, counts)
#' @export
tree_fun <- function(el, values, f) {
  units <- el %>%
    as.character() %>%
    unique()

  result <- setNames(values[units], units)
  internal_nodes <- names(which(is.na(result)))

  for (i in seq_along(internal_nodes)) {
    cur_tips <- tip_descendants(as.matrix(el), internal_nodes[i])
    result[internal_nodes[i]] <- f(values[cur_tips])
  }
  result
}

#' @title Aggregate values in tips to internal nodes
#'
#' @description Given a value associated with each tip in a tree, this
#' calculates, for each internal node, the sum across all tips that descend from
#' it.
#' @param el [character data.frame] The edgelist specifying the tree structure.
#' The first column are character names for the parents, the second are
#' children.
#' @param values [named vector] Tip values on which to aggregate. The names must
#' be the same names as in el.
#' @importFrom magrittr %>%
#' @importFrom data.table data.table
#' @examples
#' el <- data.frame(
#'   parent = c("1", "1","2", "2", "2"),
#'   child = c("2", "7", "3", "4", "5"),
#'   stringsAsFactors = FALSE
#' )
#' counts  <- c(
#'   "7" = 10,
#'   "3" = 2,
#'   "4" = 5,
#'   "5" = 1
#' )
#' tree_sum(el, counts)
#' @export
tree_sum <- function(el, values) {
  tree_fun(el, values, sum)
}

#' @title Average values in tips to internal nodes
#'
#' @description Given a value associated with each tip in a tree, this
#' calculates, for each internal node, the sum across all tips that descend from
#' it.
#' @param el [character data.frame] The edgelist specifying the tree structure.
#' The first column are character names for the parents, the second are
#' children.
#' @param values [named vector] Tip values on which to aggregate. The names must
#' be the same names as in el.
#' @importFrom magrittr %>%
#' @importFrom data.table data.table
#' @examples
#' el <- data.frame(
#'   parent = c("1", "1","2", "2", "2"),
#'   child = c("2", "7", "3", "4", "5"),
#'   stringsAsFactors = FALSE
#' )
#' counts  <- c(
#'   "7" = 10,
#'   "3" = 2,
#'   "4" = 5,
#'   "5" = 1
#' )
#' tree_mean(el, counts)
#' @export
tree_mean <- function(el, values) {
  tree_fun(el, values, mean)
}

#' @title Get all the descendants that are tips
#'
#' @description This is a helper for tree_sum, which gets the names of tip nodes
#' that descend from a specified internal node, given an edgelist specifying the
#' tree structure.
#' @param el [character matrix] A matrix specifying the tree structure. The
#' first column are character names for the parents, the second are children.
#' @param cur_node [character] The name of the internal node to search for
#' descendants from. The name must appear in el.
#' @return tips [character vector] A character vector of tip nodes that descend
#' from cur_node.
#' @importFrom igraph graph.edgelist subcomponent
#' @examples
#' library("phyloseq")
#' data(GlobalPatterns)
#' GP <- subset_taxa(GlobalPatterns, Phylum=="Chlamydiae")
#' el <- phy_tree(GP)$edge
#' tip_descendants(el, 34)
tip_descendants <- function(el, cur_node) {
  G <- graph.edgelist(el)
  tips <- setdiff(el[, 2], el[, 1])
  descendants <- subcomponent(
    G,
    v = cur_node,
    mode = "out"
  )
  tips[tips %in% names(descendants)]
}

#' @title Get root node
#' @param el [character matrix] A matrix specifying the tree structure. The
#' first column are character names for the parents, the second are children.
#' @return [character vector] A vector of nodes that have children but no
#' parents
#' @export
get_root <- function(edges) {
  edges <- as.matrix(edges)
  setdiff(edges[, 1], edges[, 2])
}

#' @title Wrapper to compute tree aggregations over many samples
#' @param el [character data.frame] The edgelist specifying the tree structure.
#' The first column are character names for the parents, the second are
#' children.
#' @param values [matrix] Tip values on which to aggregate. The column names
#' must be the same names as in el. Each row corresponds to a different sample.
#' @param tree_fun [function] The tree function to apply to each row of values.
#' @return result [data.table] A data.table giving aggregated values for each of
#' sample, along with the row index of the sample on which that aggregation was
#' performed. The row index can be used for inputting sample / time / group
#' information after the fact.
#' @importFrom data.table data.table rbindlist
#' @export
tree_fun_multi <- function(el, values, tree_fun) {
  result <- list()
  for (i in seq_len(nrow(values))) {
    if (i %% 10 == 0) {
      cat(sprintf("Processing sample %d \n", i))
    }

    cur_values <- tree_fun(el, values[i, ])
    result[[i]] <- data.table(
      "unit" = names(cur_values),
      "row" = i,
      "value" = as.numeric(cur_values)
    )
  }

  rbindlist(result)
}

#' Merge edges and values into one data.table
#'
#' @param edges [matrix, data.frame, or data.table] Two columns of characters
#' giving parents and children for each edge in the tree.
#' @param values [data.frame or data.table] An object mapping unique units /
#' times / groups to their values. It must have a column "unit" giving the node
#' id, and optionally accepts columns "time" or "group" for timeboxes or DOI
#' sankeys.
#' @return merged_values [data.table] A data.table mapping each edge to the
#' value for the associated child node.
#' @importFrom data.table is.data.table data.table uniqueN
#' @importFrom dplyr left_join group_by summarise arrange select
merge_edge_values <- function(edges, values) {
  values <- data.table(values)[, lapply(.SD, as.character)]
  values$value <- as.numeric(values$value)

  n_unique <- nrow(values[, setdiff(colnames(values), "value"), with = F])
  if (n_unique != nrow(values)) {
    warning("Duplicate values for same unit / time / group, using average.")
  }

  data.table(edges) %>%
    left_join(values, by = c("child" = "unit")) %>%
    group_by(parent, child) %>%
    summarise(mval = mean(value)) %>%
    arrange(parent, desc(mval)) %>%
    select(parent, child)
}
