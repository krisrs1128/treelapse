## --- setup ----
library("treelapse")
library("phyloseq")
library("plyr")
library("dplyr")
library("reshape2")


## ----  get-data----
pregnancy_path <- "http://statweb.stanford.edu/~susan/papers/Pregnancy/PregnancyClosed15.Rdata"
tmp <- tempfile()
download.file(pregnancy_path, tmp)
load(tmp)

# just one person, one type of sample
PS <- PS %>%
  subset_samples(SubjectID %in% c("10028") &
                   BodySite == "Vaginal_Swab") %>%
  filter_taxa(function(x) sd(x) > .00001, TRUE)

# setup dates
sample_info <- sample_data(PS)
sample_info$DateColl <- sample_info$DateColl %>%
  strptime("%m/%d/%y %H:%M") %>%
  as.numeric()
sample_info$DateColl <- (sample_info$DateColl - min(sample_info$DateColl)) / (3600 * 24)

## ----  get-values----
taxa <- taxa_edgelist(tax_table(PS))
values <- list()

for (i in seq_len(nrow(sample_info))) {
  print(i)
  cur_values <- asinh(otu_table(PS)[i, ]@.Data)
  cur_values <- setNames(
    as.numeric(cur_values),
    colnames(cur_values)
  )

  cur_date <- as.character(sample_info[i, ]$DateColl)
  values[[cur_date]] <- tree_sum(
    data.frame(taxa),
    cur_values
  )
}

mvalues <- do.call(rbind, values) %>%
  melt()
colnames(mvalues) <- c("time", "unit", "value")

##---- timebox-vis ----
timebox_tree(mvalues, taxa, "Bacteria", 700, 500, size_min = 1, size_max = 20)

## ---- treebox-vis ----
treebox(mvalues, taxa, "Bacteria", 700, 500, size_min = 1, size_max = 30)
