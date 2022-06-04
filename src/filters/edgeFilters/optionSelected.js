// return "checked" if this option was specified in the querystring
export default function (val, key) {
  if(val == key) return "checked";
  return false;
}
