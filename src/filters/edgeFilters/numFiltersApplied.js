// return the number of truthy properties in the query object
export default function(query){    

  // ignore some default filters
  delete query.includeUnknownRent;
  delete query.includeUnknownIncome;

  const notNull = Object.values(query).filter(val => val)
  return notNull.length;

}
