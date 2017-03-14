#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom magrittr %>%
#' @importFrom dplyr arrange select left_join group_by summarise
#' @importFrom jsonlite toJSON
#' @export
doi_tree <- function(values,
                     edges,
                     focus_node_id = NULL,
                     width = NULL,
                     height = NULL,
                     style_opts = list()) {
  root <- get_root(edges)
  if (is.null(focus_node_id)) {
    focus_node_id  <- root
  }

  edges <- edges %>%
    merge_edge_values(values)

  # forward options using x
  x <- list(
    values,
    edges,
    root,
    focus_node_id,
    merge_doi_style(style_opts)
  )

  # create widget
  htmlwidgets::createWidget(
    name = "doi_tree",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}
