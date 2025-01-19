const markdown = require('marked');
const eleventyImage = require('@11ty/eleventy-img');

// This is a global sort ranking for all filter options.
// It assumes no name collisions.
// Highest rank = 1.
// Force an item to be ranked last every time with rank = -1.
const SORT_RANKING = new Map([
  // Unit Type
  ['SRO', 1],
  ['Studio', 2],
  ['Others', -1],
  // Availability
  ['Available', 1],
  ['Waitlist Open', 2],
  ['Waitlist Closed', 3],
  ['Call for Availability', 4],
  // Populations Served
  ['General Population', 1],
  ['Seniors', 2],
  ['Youth', 3],
  ['Developmentally Disabled', 4],
  ['Physically Disabled', 5],
]);

module.exports = function(eleventyConfig) {
  const makeImage = async function(image, width, format='auto') {
    const metadata = await eleventyImage(image['FILE'][0].url, {
      widths: [width, width * 2, width * 3],
      formats: [format],
      urlPath: '/images/',
      outputDir: './dist/images/',
    });

    // Note don't use 'format' here because it might be auto which does not
    // appear in the resulting metadata keys.
    const formatKey = Object.keys(metadata)[0];
    const src = metadata[formatKey][0];
    const srcset = metadata[formatKey].map((m) => `${m.srcset}`);

    return `<img alt="${image['IMAGE_DESCRIPTION']}" loading="lazy" ` +
      `decoding="async" src="${src.url}" width="${src.width}" ` +
      `height="${src.height}" srcset="${srcset.join(',')}" sizes="${width}px">`;
  };

  eleventyConfig.addShortcode('image', async function(image, format='jpeg') {
    return await makeImage(image, 800, format);
  });

  // Markdown filter
  eleventyConfig.addFilter('markdownify', (str) => {
    str = str.replaceAll('http:///', '/');
    const markup = markdown.marked(str);
    return markup.replaceAll(/(href="https?:\/\/.*?")/g,
      '$1 target="_blank" rel="noopener"');
  });

  // Substitute placeholder text with the appropriate markup.
  eleventyConfig.addAsyncFilter('unplaceholder', async (str, imageList=null) => {
    str = str.replaceAll('{{notranslate}}', '<span translate="no">');
    str = str.replaceAll('{{endnotranslate}}', '</span>');
    if (imageList !== null) {
      for (const match of str.matchAll(/{{image ([a-z0-9-]+) ?(\d*)}}/g)) {
        const imageTag = await makeImage(imageList[match[1]], match?.[2]);
        str = str.replace(match[0], imageTag);
      }
    }
    return str;
  });


  // Get all of the unique values of a property
  eleventyConfig.addFilter('index', function(collection, property) {
    let values = [];
    for (const item in collection) {
      if (collection[item][property]) {
        values = values.concat(collection[item][property]);
      }
    }
    return [...new Set(values)];
  });

  // Filter a data set by a value present in an array property
  eleventyConfig.addFilter('whereIncluded', function(collection, key, value) {
    const filtered = [];
    for (const item in collection) {
      if (collection[item][key] && collection[item][key].includes(value)) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  });
  // Filter a data set by a value present in an array property
  eleventyConfig.addFilter('whereEmpty', function(collection, key) {
    const filtered = [];
    for (const item in collection) {
      if (!collection[item][key]) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  });

  // Groups items in a collection by one or more keys.
  // The result is a list of key/value pairs where all items having the same
  // value for 'keys' in the original 'collection' are grouped.  Specify
  // multiple grouping keys with a comma-separated list. The result
  // is a list of group objects having the following properties:
  //   key: The values of 'keys' in 'collection' that form this group
  //   values: The items in 'collection' that form this group
  //   key0..N: The values of keys used to create the group, one for each key
  //
  // Example:
  // const myList = [
  //   {'type': '1br', 'status': 'open', 'rent': 100},
  //   {'type': '1br', 'status': 'closed', 'rent': 300},
  //   {'type': '1br', 'status': 'open', 'rent': 500},
  //   {'type': '2br', 'status': 'closed', 'rent': 300},
  // ];
  // groupBy(myList, 'type,status');
  //   [
  //     {
  //       'key':'1br__open',
  //       'values':
  //         [{'type': '1br', 'status': 'open', 'rent': 100},
  //          {'type': '1br', 'status': 'open', 'rent': 500}],
  //       'key0': '1br',
  //       'key1': 'open',
  //     },
  //     {
  //       'key': '1br__closed',
  //       'values':
  //         [{'type': '1br', 'status': 'closed', 'rent': 300}]},
  //       'key0': '1br',
  //       'key1': 'closed',
  //     {
  //       'key': '2br__closed',
  //       'values':
  //         [{'type': '2br', 'status': 'closed', 'rent': 100}]},
  //       'key0': '2br',
  //       'key1': 'closed',
  //   ]
  eleventyConfig.addFilter('groupBy', function(collection, keys) {
    const SEPARATOR = '__';
    const groupMap = {};
    const keyArr = [].concat(keys);
    for (const item of collection) {
      const keyValue = keyArr.map((k) => item[k]).join(SEPARATOR);
      groupMap[keyValue] = groupMap[keyValue] || [];
      groupMap[keyValue].push(item);
    }
    const grouped = [];
    for (const groupKey in groupMap) {
      if (Object.hasOwn(groupMap, groupKey)) {
        const entry = {'key': groupKey, 'values': groupMap[groupKey]};
        for (const [index, key] of groupKey.split(SEPARATOR).entries()) {
          entry['key' + index] = key;
        }
        grouped.push(entry);
      }
    }
    return grouped;
  });

  // Returns either the 'singular' string or 'plural' string depending on 'num'.
  // If 'num' is not a number, will return null.
  eleventyConfig.addFilter('pluralize', function(num, singular, plural) {
    const parsedNum = Number(num);
    if (Number.isNaN(parsedNum)) {
      return null;
    }
    if (Math.abs(parsedNum) == 1) {
      return singular;
    }
    return plural;
  });

  // Generates a URL query string from Eleventy serverless query parameters.
  eleventyConfig.addFilter('queryString', function(queryParams) {
    const searchParams = new URLSearchParams(queryParams);
    return searchParams.toString();
  });

  // Formats a value as USD with no decimals.
  eleventyConfig.addFilter('money', function(value) {
    return formatCurrency(value);
  });

  eleventyConfig.addFilter('getValidatedLocCoords', function(address) {
    if (address.verifiedLocCoords &&
        address.locCoords) {
      const coords = address.locCoords.split(',');
      if (coords.length == 2) {
        const lat = Number.parseFloat(coords[0]);
        const lng = Number.parseFloat(coords[1]);
        // Basic bounds checking. Note this also kicks out coordinates that
        // can't be parsed, since NaN will always fail the below check.
        if (lat > 35.952462 && lat < 38.216103 &&
          lng > -123.069952 && lng < -120.806286) {
          return [lat, lng];
        }
      }
    }
    return;
  });

  const compareRents = function(a, b) {
    // Compare rent table rows.
    // If both units have differing rent, sort according to those.
    // Otherwise, use min income if available.
    // Otherwise, use max income (the low end of the range) if available.
    // Otherwise, use AMI percentage if available.
    // If the units have none of those three values, don't sort at all, as
    // there is nothing to compare against.
    let compA = 0;
    let compB = 0;
    if (a.rent.amount && b.rent.amount && a.rent.amount != b.rent.amount) {
      compA = a.rent.amount;
      compB = b.rent.amount;
    } else if (a.minIncome.amount &&
        b.minIncome.amount &&
        a.minIncome.amount != b.minIncome.amount) {
      compA = a.minIncome.amount;
      compB = b.minIncome.amount;
    } else if (a.maxIncome.low &&
        b.maxIncome.low &&
        a.maxIncome.low != b.maxIncome.low) {
      compA = a.maxIncome.low;
      compB = b.maxIncome.low;
    } else if (a.incomeBracket &&
        b.incomeBracket &&
        a.incomeBracket != b.incomeBracket) {
      compA = a.incomeBracket;
      compB = b.incomeBracket;
    }
    if (compA < compB) {
      return -1;
    }
    if (compA > compB) {
      return 1;
    }
    return 0;
  };

  eleventyConfig.addFilter('sortUnitOfferings', function(units) {
    return units.sort(compareRents);
  });

  // Sorts items according to the ranking defined in SORT_RANKING.
  eleventyConfig.addFilter('rankSort', function(values, properties='') {
    const sorted = values.sort(function(a, b) {
      const props = [].concat(properties);
      let ret = 0;
      for (const prop of props) {
        const valA = prop ? a[prop] : a;
        const valB = prop ? b[prop] : b;
        const rankA = SORT_RANKING.get(valA);
        const rankB = SORT_RANKING.get(valB);
        // Special handling for the -1 rank, which is always sorted last.
        if (rankB < 0) {
          ret = -1;
        } else if (rankA < 0) {
          ret = 1;
        // Sort by rank if both items have one.
        } else if (rankA && rankB) {
          ret = rankA - rankB;
        // Put unranked items after the ranked ones.
        } else if (rankA && !rankB) {
          ret = -1;
        } else if (!rankA && rankB) {
          ret = 1;
        // Sort unranked items alphabetically.
        } else if (valA < valB) {
          ret = -1;
        } else if (valA > valB) {
          ret = 1;
        }
        // If the values are the same, continue on with the next property to
        // try to sort them.
        // Otherwise, get out of the loop because the items can be sorted via
        // this property.
        if (ret != 0) {
          break;
        }
      }
      return ret;
    });
    return sorted;
  });

  // There seems to be a bug? maybe? with LiquidJS sorting lists that include
  // undefined values
  eleventyConfig.addFilter('sort_undefined', function(values, prop='') {
    const sorted = values.sort(function(a, b) {
      const valA = prop ? a[prop] : a;
      const valB = prop ? b[prop] : b;
      if (valA < valB) {
        return -1;
      }
      if (valA > valB) {
        return 1;
      }
      return 0;
    });
    return sorted;
  });

  eleventyConfig.addFilter('numFiltersApplied', function(query) {
    // TODO: Don't hardcode this list of filters here.
    const allowedFilters = [
      'city',
      'availability',
      'unitType',
      'propertyName',
      'rentMax',
      'income',
      'populationsServed',
      'wheelchairAccessibleOnly',
      'excludeReferrals',
    ];
    let count = 0;
    for (const key in query) {
      if (allowedFilters.includes(key) && query[key]) {
        count++;
      }
    }
    return count;
  });

  // Add filter checkbox state from the query parameters to 'filterValues'.
  eleventyConfig.addFilter('updateFilterState', function(filterValues, query) {
    // The AssetCache holding filterValues stores a buffered version of the
    // cached filterValues and does not read it in from the filesystem on each
    // page render. We need to be sure to not modify the original object, lest
    // those edits persist in the cached object.
    const filterValuesCopy = JSON.parse(JSON.stringify(filterValues));
    // If there is no query (such as on the affordable housing landing page)
    // there is no state to add to the filterValues.
    if (!query) {
      return filterValuesCopy;
    }

    // Updates the state of the FilterSection with the name 'filterName'
    // according to 'queryValue'
    function updateFilterSection(queryValue, filterName) {
      if (!queryValue) {
        return;
      }
      const selectedOptions = queryValue.split(', ');
      const filterIdx = filterValuesCopy.findIndex((f) => f.name == filterName);
      if (filterIdx < 0) {
        return;
      }
      for (const selectedOption of selectedOptions) {
        const idx = filterValuesCopy[filterIdx].options.findIndex(
          (v) => v.name.split(', ').includes(selectedOption));
        if (idx >= 0) {
          filterValuesCopy[filterIdx].options[idx].selected = true;
        }
      }
    }
    for (const section in query) {
      if (Object.hasOwn(query, section)) {
        updateFilterSection(query[section], section);
      }
    }

    return filterValuesCopy;
  });


  // Changes the URL query parameters to get rid of waitlist closed locations.
  //
  // If nothing is set for the availability parameter or if "Waitlist Closed" is
  // the only value set, all availabilities will be added to the URL query
  // parameters *except* "Waitlist Closed".
  // If there is something set for the availability parameter, "Waitlist Closed"
  // will simply be removed from the existing list of values.
  //
  // This funtion is intended to be used to generate a URL query string that
  // forces properties with a closed waitlist to be filtered out.  "query" is an
  // eleventy.serverless.query object and "allAvailabilities" is a list of
  // all possible values for the availability parameter, generally fetched
  // ahead of time from Airtable.  Returns a URL query string.
  eleventyConfig.addFilter('removeWaitlistClosed', function(query,
    allAvailabilities) {
    const availKey = 'availability';
    const closedValue = 'Waitlist Closed';
    const queryParams = new URLSearchParams(query);
    // Copy existing availability values that were set by the user.
    let availabilityValues = queryParams.get(availKey);
    if (!availabilityValues || availabilityValues === closedValue) {
      // The user had no availabilities set or only asked for waitlist closed,
      // so initialize to the full list.
      availabilityValues = allAvailabilities.join(', ');
    }
    // Remove the Waitlist Closed item from the availability values.
    availabilityValues = (availabilityValues.split(', ')
      .filter((x) => x !== closedValue).join(', '));
    queryParams.set(availKey, availabilityValues);
    return queryParams.toString();
  });

  // Converts "camelCaseString" to "Camel Case String".
  // https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
  const camelCaseToSpaces = function(str) {
    // Insert space before each capital letter.
    const spaced = str.replace(/([A-Z])/g, ' $1');
    // The first word is all lowercase, so capitalize it.
    return `${spaced[0].toUpperCase()}${spaced.slice(1)}`;
  };

  // Formats a value as USD with no decimals.
  const formatCurrency = function(value) {
    const num = Number(value);
    if (isNaN(num)) {
      return '';
    } else {
      return num.toLocaleString('en-US',
        {
          style: 'currency',
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
          currency: 'USD',
        });
    }
  };

  eleventyConfig.addPairedShortcode('eligPage', function(content, id) {
    return `<div id="page-${id}" class="elig_page hidden">${content}</div>`;
  });

  eleventyConfig.addPairedShortcode('eligSection', function(content, id) {
    return (
      `<div id="section-${id}" class="elig_section hidden">${content}</div>`);
  });

  // Renders a single public assistance program to display in a list.
  eleventyConfig.addPairedShortcode('program', function(
    content, title, id, applyUrl, refUrl='') {
    function extIndicator(href) {
      if (href.slice(0, 4) === 'http') {
        return '<sup>&#8599;</sup>';
      }
      return '';
    }

    const links = [];
    if (applyUrl) {
      links.push(`
        <p class="unenrolled_only">
          <a href="${applyUrl}" target="_blank"
            rel="noopener">How to apply</a>${extIndicator(applyUrl)}
        </p>`);
    }
    if (refUrl) {
      links.push(`
        <p>
          <a href="${refUrl}" target="_blank"
            rel="noopener">Learn more</a>${extIndicator(refUrl)}
        </p>`);
    }
    links.push(`
      <p class="unenrolled_only">
        <a href="/contact" target="_blank">Contact us for help applying</a>
      </p>`);
    return `
      <li id="program-${id}" data-default-title="${title}">
        <h4>${title}</h4>
        <ul class="elig_flags unenrolled_only"></ul>
        <p>${content}</p>
        ${links.join('')}
        <h5 class="unenrolled_only">To be eligible, you must:</h5>
        <ul class="elig_conditions unenrolled_only"></ul>
      </li>`;
  });

  // Generates a list that can have items added and removed dynamically.
  eleventyConfig.addPairedShortcode('dynamicFieldList', function(
    listItemContent, addText, emptyAddText, templateContent) {
    let templateStr = '';
    let listItemStr = '';
    if (templateContent) {
      templateStr = `
        <template>
          ${templateContent}
        </template>`;
    }
    if (listItemContent.trim()) {
      listItemStr = `
        <li data-static-item>
          ${listItemContent}
        </li>`;
    }
    const buttonStr = `<button type="button" ` +
      `class="btn btn_secondary field_list_add" ` +
      `data-non-empty-text="${addText}" ` +
      `data-empty-text="${emptyAddText}">${emptyAddText}</button>`;
    return `
      <div class="dynamic_field_list_wrapper">
        <ul class="dynamic_field_list">
          ${templateStr}
          ${listItemStr}
        </ul>
        <div>
          ${buttonStr}
        </div>
      </div>`;
  });

  eleventyConfig.addShortcode('checkboxTable', function(
    tableId, columnsStr, rowsStr, sortFirstCol=true) {
    function unpack(str) {
      const parts = str.split(':');
      return {id: parts[0].trim(), content: parts[1].trim()};
    }

    function sortByContent(a, b) {
      const strA = a.content.toLowerCase();
      const strB = b.content.toLowerCase();
      if (strA < strB) {
        return -1;
      }
      if (strA > strB) {
        return 1;
      }
      return 0;
    }

    const columns = columnsStr.split('\n').map(unpack);
    const rows = rowsStr.split('\n').map(unpack);
    if (sortFirstCol) {
      rows.sort(sortByContent);
    }

    const columnsHtml = ['<th></th>'];
    for (const column of columns) {
      columnsHtml.push(`
        <th id="col-label-${column.id}">
          ${column.content}
        </th>`);
    }
    const rowsHtml = [];
    for (const row of rows) {
      const cellsHtml = [];
      for (const column of columns) {
        const checkboxStr = `<input type="checkbox" ` +
          `id="${tableId}-${row.id}-${column.id}" ` +
          `aria-labelledby="row-label-${row.id} col-label-${column.id}">`;
        cellsHtml.push(`
          <td>
            ${checkboxStr}
          </td>`);
      }
      rowsHtml.push(`
        <tr>
          <td class="label" id="row-label-${row.id}">
            ${row.content}
          </td>
          ${cellsHtml.join('')}
        </tr>`);
    }

    return `
      <table>
        <thead>
          <tr>
            ${columnsHtml.join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.join('')}
        </tbody>
      </table>`;
  });

  eleventyConfig.addPairedShortcode('singleselect', function(options, id) {
    delete this.page.singleselectId;
    return `
      <ul id="${id}" class="singleselect">
        ${options}
      </ul>`;
  });

  eleventyConfig.addShortcode('yesNo', function(id) {
    return `
      <ul id="${id}" class="yes-no">
        <li>
          <input type="radio" id="${id}-yes" name="${id}">
          <label for="${id}-yes">Yes</label>
        </li>
        <li>
          <input type="radio" id="${id}-no" name="${id}">
          <label for="${id}-no">No</label>
        </li>
      </ul>`;
  });

  eleventyConfig.addPairedShortcode('option', function(labelText, id) {
    this.page.singleselectId = (this.page.singleselectId ||
      `singleselect-${Math.floor(Math.random() * 1000)}`);
    return `
      <li>
        <input type="radio" id="${id}" name="${this.page.singleselectId}">
        <label for="${id}">${labelText.trim()}</label>
      </li>`;
  });

  eleventyConfig.addShortcode('dategroup', function(id, labelText) {
    /* eslint-disable max-len */
    return `
      <div role="group" aria-label="${labelText}">
        <span class="label">${labelText}</span>
        <div id="${id}" class="dategroup">
          <div class="dategroup_item">
            <label for="${id}-month"><span class="visually_hidden">${labelText} </span>Month</label>
            <input type="number" min="0" max="12"
              class="date_month" id="${id}-month">
          </div>
          <div class="dategroup_item">
            <label for="${id}-day">Day</label>
            <input type="number" min="0" max="31"
              class="date_day" id="${id}-day">
          </div>
          <div class="dategroup_item">
            <label for="${id}-year">Year</label>
            <input type="number" min="0" max="${new Date().getFullYear()}"
              class="date_year" id="${id}-year">
          </div>
        </div>
      </div>`;
    /* eslint-enable max-len */
  });

  // Generates a label tag for the given 'fieldName'.
  //
  // The parameter 'fields' is
  // a list of Airtable fields returned by fetchHousingSchema() in
  // affordable-housing-changes.11tydata.js. The user-visible labels text is
  // given by 'labelText'.  This function automatically generates a field id
  // that will match the id generated by formField() for the same 'fieldName'.
  // An optional 'index' string will be appended to the generated id like
  // "id:index".  If the field specified by 'fieldName' includes a description,
  // it will be rendered next to the label text as a hover tooltip icon.
  const fieldLabel = function(labelText, fields, fieldName, index='') {
    const forAttr = `${fields[fieldName].id}${index !== '' ? ':' + index : ''}`;
    const tag = `<label for="${forAttr}">${labelText}</label>`;
    let tooltip = '';
    if (fields[fieldName].description) {
      const descStr = fields[fieldName].description.replace(/\n/g, '<br/>');
      tooltip = `
        <p data-toggletip data-toggletip-class="icon_query">
          ${descStr}
        </p>`;
    }
    return `${tag} ${tooltip}`;
  };

  // Generates an HTML form input for the field specified by 'fieldName'.
  //
  // The parameter 'fields' is a list of Airtable fields returned by
  // fetchHousingSchema() in affordable-housing-changes.11tydata.js. The type
  // of input rendered depends on the data type of the Airtable field.
  // This function automatically generates a field id that will match the id
  // generated by fieldLabel() for the same 'fieldName'. An optional 'index'
  // string will be appended to the generated id like 'id:index'. The input
  // (or select, or textarea) element style can be adjusted with the 'className'
  // string.
  const formField = function(fields, fieldName, className='', index='') {
    const field = fields[fieldName];
    let tag = '';
    let options = '';
    let content = '';
    let etag = '';
    const indexStr = index !== '' ? ':' + index : '';
    const classStr = className !== '' ? `class="${className}"` : '';
    if (field.type === 'singleSelect') {
      tag = 'select';
      etag = '</select>';
      content = `<option></option>`;
      for (const choice of field.options.choices) {
        content += `<option value="${choice.name}"
          data-color="${choice.color}">${choice.name}</option>`;
      }
    } else if (field.type === 'multipleSelects') {
      const checkboxes = [];
      for (const choice of field.options.choices) {
        const choiceId = choice.name.replace(/\s/g, '-').toLowerCase();
        const id = `${field.id}:${choiceId}${indexStr}`;
        checkboxes.push(`<input type="checkbox" id="${id}"
          name="${field.name}${indexStr}" value="${choice.name}"
          data-color="${choice.color}"> <label
          for="${id}">${choice.name}</label>`);
      }
      // Break out of the generalized element generation and just
      // return what we've come up with above for multipleSelects.
      return checkboxes.join('<br/>');
    } else if (field.type === 'multilineText') {
      tag = 'textarea';
      etag = '</textarea>';
    } else if (field.type === 'number') {
      const precision = Number(field.options.precision);
      tag = 'input';
      options = `type="number" min="0" step="${10 ** (-1 * precision)}"`;
    } else if (field.type === 'email') {
      tag = 'input';
      options = `type="email"`;
    } else if (field.type === 'phoneNumber') {
      tag = 'input';
      options = `type="tel"`;
    } else if (field.type === 'url') {
      tag = 'input';
      options = `type="url"`;
    } else if (field.type === 'singleLineText') {
      tag = 'input';
      options = `type="text"`;
    } else if (field.type === 'checkbox') {
      tag = 'input';
      options = `type="checkbox"`;
    } else {
      return '';
    }
    return `<${tag} id="${field.id}${indexStr}"
      name="${field.name}${indexStr}" ${options} ${classStr}>${content}${etag}`;
  };

  eleventyConfig.addShortcode('fieldLabel',
    function(labelText, fields, fieldName) {
      return fieldLabel(labelText, fields, fieldName);
    });

  eleventyConfig.addShortcode('indexedFieldLabel',
    function(index, labelText, fields, fieldName) {
      return fieldLabel(labelText, fields, fieldName, index);
    });

  eleventyConfig.addShortcode('formField',
    function(fields, fieldName, className='') {
      return formField(fields, fieldName, className);
    });

  eleventyConfig.addShortcode('indexedFormField',
    function(index, fields, fieldName, className='') {
      return formField(fields, fieldName, className, index);
    });


  // Generates a rendered summary of affordable housing filter options.
  eleventyConfig.addShortcode('querySummary', function(query) {
    // Copy the query so we don't modify it directly when making changes later.
    const queryCopy = JSON.parse(JSON.stringify(query));
    // The includeUnknown(Rent|Income) parameters only apply if a rent or income
    // is supplied, so remove them if they do not apply.
    if (queryCopy['includeUnknownRent'] && !queryCopy['rentMax']) {
      delete queryCopy['includeUnknownRent'];
    }
    if (queryCopy['includeUnknownIncome'] && !queryCopy['income']) {
      delete queryCopy['includeUnknownIncome'];
    }
    const filtersApplied = [];
    for (const parameter in queryCopy) {
      if (Object.hasOwn(queryCopy, parameter)) {
        let value = queryCopy[parameter];
        if (!value) {
          continue;
        }
        if (parameter == 'rentMax' || parameter == 'income') {
          value = formatCurrency(Number(value));
        }
        if (value == 'on') {
          // Simply showing the parameter key is enough.  No need to also show
          // "on" or similar (e.g. "yes", "true").
          value = '';
        }
        let valueStr = '';
        if (value) {
          valueStr = `: ${value}`;
        }
        filtersApplied.push(`<span class="badge"><span class="bold">` +
          `${camelCaseToSpaces(parameter)}</span>${valueStr}</span>`);
      }
    }
    return filtersApplied.join(' ');
  });

  // Summarizes the 'units' array of each item in 'housingList' by the
  // 'summarizeBy' keys.
  // 'housingList' is an array of apartments returned by the housingResults
  // filter. 'summarizeBy' is a list of unit keys
  // (e.g. ["openStatus", "unitType"]) that all units in a given apartment
  // should be summarized by.  The summary is generated by removing all keys
  // except those in 'summarizeBy' and then getting the unique set of the
  // resulting array of units.
  eleventyConfig.addFilter('summarizeUnits', function(
    housingList, summarizeBy) {
    const housingListCopy = JSON.parse(JSON.stringify(housingList));
    for (const housing of housingListCopy) {
      const summary = new Set();
      for (const unit of housing.units) {
        const unitSummary = {};
        for (const prop of summarizeBy) {
          unitSummary[prop] = unit[prop];
        }
        // Stringify the unitSummary so that we can ensure uniqueness
        // via the Set.  If an apartment has a single unit type offered
        // at multiple rents, we want to ensure the summary only lists
        // the unit type one time, not once for each rent offering.
        summary.add(JSON.stringify(unitSummary));
      }
      // Make an array from the Set, and also convert the stringified
      // unit objects back into objects.
      housing.units = [...summary].map((x) => JSON.parse(x));
    }
    return housingListCopy;
  });

  eleventyConfig.addFilter('filterByQuery', function(housingList, query) {
    query = query || '';
    console.log(query);
    let housingListCopy = JSON.parse(JSON.stringify(housingList));

    // When filtering on unit-level data, it's important to filter out
    // units and not entire apartments.  A certain apartment may have
    // some units that match the query criteria and some that don't.
    // If none of an apartment's units match the criteria, the apartment
    // will stay in housingListCopy, but the 'units' array within will be empty.
    // These apartments will be filtered out just prior to returning the
    // final filtered array.
    if (query.excludeReferrals) {
      housingListCopy = housingListCopy.filter((a) => !a.disallowsPublicApps);
    }

    if (query.unitType) {
      const rooms = query.unitType.split(', ');
      housingListCopy = housingListCopy.map((apt) => {
        apt.units = (
          apt.units.filter((u) => rooms.includes(u.type)));
        return apt;
      });
    }

    if (query.city) {
      const cities = query.city.split(', ');
      housingListCopy = housingListCopy.filter((a) => cities.includes(a.city));
    }

    if (query.availability) {
      const availabilities = query.availability.split(', ');
      housingListCopy = housingListCopy.map((apt) => {
        apt.units = (
          apt.units.filter((u) => availabilities.includes(u.openStatus)));
        return apt;
      });
    }

    if (query.populationsServed) {
      const populations = query.populationsServed.split(', ');
      housingListCopy = housingListCopy.filter((apt) => {
        if (!apt.populationsServed.length &&
            populations.includes('General Population')) {
          // Entries with an empty _POPULATIONS_SERVED field are interpreted as
          // being open to the general public, so allow those entries as well if
          // the user wants General Population entries.
          return true;
        }
        for (const population of populations) {
          if (apt.populationsServed.includes(population)) {
            return true;
          }
        }
      });
    }

    if (query.wheelchairAccessibleOnly) {
      housingListCopy = (
        housingListCopy.filter((a) => a.hasWheelchairAccessibleUnits));
    }

    if (query.rentMax) {
      const rentMax = Number(query.rentMax);
      housingListCopy = housingListCopy.map((apt) => {
        apt.units = apt.units.filter((unit) => {
          return ((query.includeUnknownRent && !unit.rent.amount) ||
            Number(unit.rent.amount) <= rentMax);
        });
        return apt;
      });
    }

    if (query.income) {
      const income = Number(query.income);
      housingListCopy = housingListCopy.map((apt) => {
        apt.units = apt.units.filter((unit) => {
          const minIncomeMatch = (
            (query.includeUnknownIncome && !unit.minIncome.amount) ||
            Number(unit.minIncome.amount) <= income);
          const maxIncomeMatch = (
            (query.includeUnknownIncome && !unit.maxIncome.high) ||
            Number(unit.maxIncome.high) >= income);
          return minIncomeMatch && maxIncomeMatch;
        });
        return apt;
      });
    }

    if (query.propertyName) {
      const aptName = query.propertyName.toLowerCase();
      housingListCopy = housingListCopy.filter(
        (a) => a.aptName.toLowerCase().includes(aptName));
    }

    // Some properties may have had all their associated units filtered out,
    // so remove those before returning the final list of filtered properties.
    return housingListCopy.filter((a) => a.units.length);
  });

  eleventyConfig.addFilter('formatPhone', function(phoneStr) {
    const temp = phoneStr;
    phoneStr = phoneStr.replace(/\D/g, '');
    if (phoneStr.length < 10) return temp;
    if (phoneStr.length > 10) return phoneStr.replace(/(\d{3})(\d{3})(\d{4})(\d{1,})/, '$1-$2-$3 ext $4');
    return phoneStr.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  });

  eleventyConfig.addFilter('except', function(collection, value) {
    return collection.filter((x) => x != value);
  });

  eleventyConfig.addFilter('includes', function(collection, value) {
    return collection.includes(value);
  });
};
