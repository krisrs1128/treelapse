#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom magrittr %%>
#' @importFrom dplyr arrange select
#' @importFrom jsonlite toJSON
#' @export
doi_sankey <- function(values,
                       edges,
                       focus_node_id = NULL,
                       root = NULL,
                       width = NULL,
                       height = NULL,
                       size_max = 20,
                       leaf_width = 10,
                       leaf_height = 100) {
  if (is.null(focus_node_id)) {
    focus_node_id  <- edges[1, 1]
  }
  if (is.null(root)) {
    root  <- edges[1, 1]
  }

  # order branches according to abundance
  match_ix <- match(edges$child, values$unit)
  edges$value <- values[match_ix, "value"]
  edges <- edges %>%
    arrange(parent, desc(value)) %>%
    select(parent, child)

  # forward options using x
  x <- list(
    values,
    toJSON(tree_json(edges, root)),
    focus_node_id,
    size_max,
    leaf_width,
    leaf_height
  )

  # create widget
  htmlwidgets::createWidget(
    name = "doi_sankey",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}
