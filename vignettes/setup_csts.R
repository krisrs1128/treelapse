## ---- setup ----
library("treelapse")
library("phyloseq")
library("cluster")
library("plyr")
library("dplyr")
library("reshape2")

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
sample_info <- sample_data(ps)
sample_info$CST <- clust

## ---- get_values ----
sample_otu <- cbind(sample_info[, c("CST")], otu_table(ps)) %>%
  group_by(CST) %>%
  summarise_each(funs(mean))
taxa <- taxa_edgelist(tax_table(ps))

values <- list()
for (i in seq_len(nrow(sample_otu))) {
  print(i)
  cur_values <- sample_otu[i, -1]
  cur_values <- setNames(
    as.numeric(cur_values),
    colnames(cur_values)
  )

  values[[i]] <- tree_sum(data.frame(taxa), cur_values)
}

mvalues <- do.call(rbind, values) %>%
  melt()
colnames(mvalues) <- c("group", "unit", "value")

## ---- visualize ----
doi_sankey(mvalues, taxa, "Bacteria", "Bacteria", 1100, 500,
           leaf_width = 15, leaf_height = 75)
