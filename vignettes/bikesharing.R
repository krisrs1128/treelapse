#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- setup ----
library("plyr")
library("dplyr")
library("reshape2")
library("caret")
library("treelapse")
data(bike)
bike <- bike %>%
  filter(!(dteday %in% c("2012-10-29", "2012-10-30", "2011-01-18", "2011-01-27")))

## ---- featurize ----
logit <- function(p) {
  log(p / (1 - p))
}

# we'll build a tree from predicting the total demand per day
bike_day <- bike %>%
  group_by(dteday) %>%
  summarise(
    season = season[1],
    yr = yr[1],
    mnth = mnth[1],
    holidy = holiday[1],
    workinday = workingday[1],
    mean_weathersit = mean(weathersit),
    sd_weathersit = sd(weathersit),
    max_weathersit = max(weathersit),
    min_weathersit = min(weathersit),
    range_weathersit = max(weathersit) - min(weathersit),
    mean_temp = mean(temp),
    sd_temp = sd(temp),
    max_temp = max(temp),
    min_temp = min(temp),
    range_temp = max(temp) - min(temp),
    mean_atemp = mean(atemp),
    sd_atemp = sd(atemp),
    max_atemp = max(atemp),
    min_atemp = min(atemp),
    range_atemp = max(atemp) - min(atemp),
    mean_hum = mean(hum),
    sd_hum = sd(hum),
    max_hum = max(hum),
    min_hum = min(hum),
    range_hum = max(hum) - min(hum),
    mean_windspeed = mean(logit(windspeed)),
    sd_windspeed = sd(logit(windspeed)),
    max_windspeed = max(logit(windspeed)),
    min_windspeed = min(logit(windspeed)),
    range_windspeed = max(logit(windspeed)) - min(logit(windspeed)),
    cnt_morning = cnt[8]
  )

## ---- train-model ----
x <- bike_day %>%
  select(-c(dteday, cnt_morning)) %>%
  as.matrix()
y <- bike_day$cnt_morning

tune_grid <- data.frame("cp" = c(.001))
cart_model <- train(x = x, y = y, method = "rpart", tuneGrid = tune_grid)

## ---- get-tree-paths ----
leaf_ix <- cart_model$finalModel$where
frame <- cart_model$finalModel$frame
leaf_assignment <- rownames(frame)[leaf_ix]

nodes <- rownames(frame)
paths <- path.rpart(cart_model$finalModel, nodes, print.it = FALSE)

depth <- max(sapply(paths, length)) + 1
for (i in seq_along(paths)) {
  if (names(paths)[i] %in% unique(leaf_assignment)) {
    paths[[i]] <- c(paths[[i]], names(paths)[i])
  }

  cur_length <- length(paths[[i]])
  if (cur_length < depth) {
    paths[[i]] <- c(
      paths[[i]],
      rep(NA, depth - cur_length)
    )
  }
}

head(paths)

## ---- build-edgelist ----
paths <- do.call(rbind, paths)
rownames(paths) <- NULL
edges <- taxa_edgelist(paths)

edges <- rbind(
  edges,
  data.frame(
    "parent" = leaf_assignment,
    "child" = paste0("sample_", unique(bike$dteday)),
    stringsAsFactors = FALSE
  )
)

## ---- time-values ----
tip_values <- data.frame(
  "unit" = paste0("sample_", bike$dteday),
  "time" = bike$hr,
  "value" = bike$cnt
) %>%
  dcast(unit ~ time, fill = 0)

grouped_list <- list()
for (i in seq_len(ncol(tip_values) - 1)) {
  cur_values <- setNames(tip_values[, i + 1], tip_values[, 1])
  grouped_list[[i]] <- tree_mean(edges, cur_values)
}

values <- do.call(rbind, grouped_list) %>%
  melt(varnames = c("time", "unit"))

## ---- timeboxes ----
timebox_tree(values, edges)

## ---- treeboxes ----
treebox(values, edges)

## ---- get-group-values ----
tip_values <- data.frame(
  "unit" = paste0("sample_", bike$dteday),
  "time" = bike$hr,
  "value" = 1,
  "cnt" = bike$cnt
) %>%
  filter(time == 8)

tip_values$group <- cut(tip_values$cnt, 5)

tip_values <- tip_values %>%
  dcast(unit ~ group, fill = 0, value.var = "value", fun.aggregate = sum)

grouped_list <- list()
for (i in seq_len(ncol(tip_values) - 1)) {
  cur_values <- setNames(tip_values[, i + 1], tip_values[, 1])
  grouped_list[[i]] <- tree_sum(edges, cur_values)
}
values <- do.call(rbind, grouped_list) %>%
  melt(varnames = c("group", "unit"))

## ---- doi-sankey ----
doi_sankey(values, edges, "root", leaf_width = 4)
