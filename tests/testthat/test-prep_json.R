context("prep_json")

test_that("Works in binary tree.", {
  el <- data.frame(
    parent = c("1", "1", "2", "2", "3", "3"),
    child = c("2", "3", "4", "5", "6", "7"),
    stringsAsFactors = FALSE
  )
  expect_equal(
    tree_json(el, "1"),
    list(
      "name" = "1",
      "children" = list(
        list(
          "name" = "2",
          "children" = list(
            list("name" = "4"),
            list("name" = "5")
          )
        ),
        list(
          "name" = "3",
          "children" = list(
            list("name" = "6"),
            list("name" = "7")
          )
        )
      )
    )
  )
})

test_that("Works in chain.", {
  el <- data.frame(
    parent = c("1", "2", "3"),
    child = c("2", "3", "4"),
    stringsAsFactors = FALSE
  )
  expect_equal(
    tree_json(el, "1"),
    list(
      "name" = "1",
      "children" = list(
        list(
          "name" = "2",
          "children" = list(
            list(
              "name" = "3",
              "children" = list(
                list("name" = "4")
              )
            )
          )
        )
      )
    )
  )
})

test_that("Fails when given wrong column names.", {
  el <- data.frame(x = c("a", "b", "c"),
                   y = c("b", "c", "d"))
  expect_error(tree_json(el, "a"))
})

test_that("Builds basic edgelist.", {
  taxa <- matrix(
    c("1", "2", "1", "2", "1", "2", "1", "6"),
    nrow = 4,
    byrow = TRUE,
    dimnames = list(c("3", "4", "5", "7"),
                    c("depth_1", "depth_2"))
  )

  el <- data.frame(
    parent = c("1", "1", "2", "2", "2", "6"),
    child = c("2", "6", "3", "4", "5", "7")
  )

  expect_equal(taxa_edgelist(taxa), el)
})

test_that("Builds edgelist when NAs are present", {
  taxa <- matrix(
    c("1", "2", "1", NA, "1", NA, "1", "6"),
    nrow = 4,
    byrow = TRUE,
    dimnames = list(c("3", "4", "5", "7"),
                    c("depth_1", "depth_2"))
  )

  el <- data.frame(
    parent = c("1", "1", "1", "1", "2", "6"),
    child = c("2", "4", "5", "6", "3", "7")
  )
  expect_equal(taxa_edgelist(taxa), el)
})
