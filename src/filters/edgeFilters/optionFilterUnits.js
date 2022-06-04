// Filter a collection of objects by the value of a provided key
// which should be present in one or more of and items Units
export default function (collection, key, value) {
  return collection.filter(obj => {
    return obj.units.some(e => e[key] === value);
  });
  
}
