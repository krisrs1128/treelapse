#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- setup ----
library("plyr")
library("dplyr")
library("caret")
library("treelapse")
data(bike)

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

x <- bike_day %>%
  select(-c(dteday, cnt_morning)) %>%
  as.matrix()
y <- bike_day$cnt_morning

tune_grid <- data.frame("cp" = c(.001))
cart_model <- train(x = x, y = y, method = "rpart", tuneGrid = tune_grid)

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
  paths[[i]] <- gsub(" ", "", paths[[i]])
}

# edges up to actual samples (the series)
paths <- do.call(rbind, paths)
rownames(paths) <- NULL
edges <- taxa_edgelist(paths)

edges <- rbind(
  edges,
  data.frame(
    "parent" = leaf_assignment,
    "child" = paste0("sample_", seq_along(leaf_assignment)),
    stringsAsFactors = FALSE
  )
)

tip_values <- data.frame(
  "unit" = paste0("sample_", as.numeric(bike$dteday)),
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

timebox_tree(values, edges)
treebox(values, edges)
