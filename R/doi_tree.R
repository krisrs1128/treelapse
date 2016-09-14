#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
doi_tree <- function(values, edges, width = NULL, height = NULL) {

  # forward options using x
  x <- list(
      values,
      edges
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
