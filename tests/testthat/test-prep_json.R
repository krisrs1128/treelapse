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
