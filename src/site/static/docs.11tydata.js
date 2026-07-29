module.exports = {
  // There is a bug in 11ty (https://github.com/11ty/buildawesome/issues/2806)
  // that prevents the permalink from being conditionally set to false during
  // pagination.  So, we just remove items from the data to be paginated
  // before the pagination runs.
  pagination: {
    before: (data) => data.filter((item) => item.paginate),
  },
};