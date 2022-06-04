// return the number of truthy properties in the query object
export default function(query){    
  const notNull = Object.values(query).filter(val => val)
  return notNull.length;
}
