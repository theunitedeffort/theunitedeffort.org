// Filter a collection of objects by the value of a provided key
export default function (collection, key, value) {
  return collection.filter(obj => {
    if(typeof obj[key] === "object") {
      return obj[key].includes(value);
    } else {
      return obj[key] === value;
    }
  });
}
