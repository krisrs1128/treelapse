## ---- setup ----
library("phyloseq")
library("cluster")
library("plyr")
library("dplyr")
library("reshape2")
library("treelapse")

## ----  prepare-csts ----
## code from http://statweb.stanford.edu/~susan/papers/Pregnancy/PNAS_Vaginal_Analysis.Rmd
pregnancy_path <- "http://statweb.stanford.edu/~susan/papers/Pregnancy/PregnancyClosed15.Rdata"
tmp <- tempfile()
download.file(pregnancy_path, tmp)
load(tmp)

site <- "Vaginal_Swab"
ps <- PSPreg[[site]] %>%
  filter_taxa(function(x) sum(x > 1) > 0.01 * length(x), TRUE) %>%
  transform_sample_counts(function(OTU) OTU/sum(OTU))

braydist <- phyloseq::distance(ps, method="bray")
ord = ordinate(ps, method = "MDS", distance = braydist)

NDIM <- 7
K <- 5
x <- ord$vectors[,1:NDIM]
clust <- as.factor(pam(x, k=K, cluster.only=T))
# SWAPPING THE ASSIGNMENT OF 2 AND 3 TO MATCH RAVEL CST ENUMERATION
clust[clust==2] <- NA
clust[clust==3] <- 2
clust[is.na(clust)] <- 3

# setup dates
sample_info <- sample_data(ps) %>%
  data.frame()
sample_info$CST <- clust

## ---- get_values ----
taxa <- taxa_edgelist(tax_table(ps))

ps <- PSPreg[[site]] %>%
  filter_taxa(function(x) sum(x > 1) > 0.01 * length(x), TRUE)

values <- list()

for (i in seq_len(nrow(otu_table(ps)))) {
  if (i %% 50 == 0) {
    cat(sprintf("Processing sample %d\n", i))
  }

  cur_values <- asinh(otu_table(ps)@.Data[i, ])
  cur_tree_values <- tree_sum(data.frame(taxa), cur_values)
  values[[i]] <- data.frame(
      "group" = sample_info[i, "CST"],
      "time" = -sample_info[i, "D2Del"],
      "unit" = names(cur_tree_values),
      "value" = as.numeric(cur_tree_values)
  )
}

values <- do.call(rbind, values)

## ---- doi-sankey ----
doi_sankey(
  values %>%
    group_by(group, unit) %>%
    summarise(value = mean(value)),
  taxa,
  "Bacteria",
  1100,
  500,
  leaf_width = 15,
  leaf_height = 75
)

## ---- timeboxes ----
# for each group, look at the timeboxes
for (i in seq_len(5)) {
  timebox_tree(
    values %>%
      filter(group == i) %>%
      group_by(unit, time) %>%
      summarise(value = mean(value)),
    taxa,
    size_min = 1
  )

  treebox(
    values %>%
      filter(group == i) %>%
      group_by(unit, time) %>%
      summarise(value = mean(value)),
    taxa,
    size_min = 1
  )
}
