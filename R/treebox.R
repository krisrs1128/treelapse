#' <Add Title>
#'
#' <Add Description>
#' @import htmlwidgets
#' @importFrom jsonlite toJSON
#' @importFrom dplyr arrange select left_join group_by summarise
#' @importFrom magrittr %>%
#' @export
treebox <- function(values,
                    edges,
                    width = NULL,
                    height = NULL,
                    size_min = 0,
                    size_max = 10
                    ) {
  root <- get_root(edges)

  # order branches according to abundance
  edges <- edges %>%
    left_join(values, by = c("child" = "unit")) %>%
    group_by(parent, child) %>%
    summarise(mval = mean(value)) %>%
    arrange(parent, desc(mval)) %>%
    select(parent, child) %>%
    as.data.frame()

  # forward options using x
  x <- list(
    values,
    root,
    edges,
    size_min,
    size_max
  )

  # create widget
  htmlwidgets::createWidget(
    name = "treebox",
    x,
    width = width,
    height = height,
    package = "treelapse"
  )
}

#' @export
treebox_output <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "treebox", width, height, package = "treelapse")
}

#' @export
render_treebox <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, treebox_output, env, quoted = TRUE)
}
