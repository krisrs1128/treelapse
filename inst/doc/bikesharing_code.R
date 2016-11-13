#! /usr/bin/env Rscript

# File description -------------------------------------------------------------

## ---- data ----
data(bike)
bike <- bike %>%
  filter(!dteday %in% c("2012-10-29", "2012-10-30", "2011-01-18", "2011-01-27"))
head(bike)
bike$dteday <- droplevels(bike$dteday)

## ---- featurize ----
logit <- function(p) {
  log(p / (1 - p))
}

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
  cbind(
    "parent" = leaf_assignment,
    "child" = paste0("sample_", levels(bike$dteday))
  )
)

## ---- time-values ----
tip_values <- data.table(
  "unit" = paste0("sample_", bike$dteday),
  "time" = bike$hr,
  "value" = bike$cnt
) %>%
  dcast.data.table(time ~ unit, fill = 0)

values <- tree_fun_multi(
  edges,
  as.matrix(tip_values[, -1, with = F]),
  tree_mean
)

values$time <- tip_values$time[values$row]

## ---- timeboxes ----
timebox_tree(values %>% select(unit, time, value), edges)

## ---- treeboxes ----
treebox(values %>% select(unit, time, value), edges)

## ---- get-group-values ----
tip_values <- data.frame(
  "unit" = paste0("sample_", bike$dteday),
  "time" = bike$hr,
  "value" = 1,
  "cnt" = bike$cnt
) %>%
  filter(time == 8)

tip_values$group <- cut(tip_values$cnt, 5)
tip_values <- data.table(tip_values) %>%
  dcast.data.table(group ~ unit, fill = 0, value.var = "value", fun.aggregate = sum)

values <- tree_fun_multi(
  edges,
  as.matrix(tip_values[, -1, with = F]),
  tree_sum
)

values$group <- as.integer(tip_values$group[values$row])

## ---- doi-sankey ----
head(values)
doi_sankey(values %>% select(unit, group, value), edges, "root", leaf_width = 4)
