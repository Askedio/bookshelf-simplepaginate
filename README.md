# bookshelf-simplepaginate
This [Bookshelf.js](https://github.com/tgriesser/bookshelf) plugin provides a Laravel like simple pagination to your models.

## Installation

Install the package via `npm`:

```sh
$ npm install --save bookshelf-simplepaginate
```

## Usage
```js
var bookshelf = require('bookshelf')(knex);

bookshelf.plugin(require('bookshelf-simplepaginate'));
```

```js
Car.query(function (qb) {
    qb.innerJoin('manufacturers', 'cars.manufacturer_id', 'manufacturers.id');
    qb.groupBy('cars.id');
    qb.where('manufacturers.country', '=', 'Sweden');
}).simplePaginate({
    limit: 15, // Defaults to 10 if not specified
    page: 3, // Defaults to 1 if not specified
    withRelated: ['engine'] // Passed to Model#fetchAll
}).then(function (results) {
    console.log(results); 
});
```

Output of results: 
```json
{
   "data": [],
   "meta": {
      "pagination": {
         "count": 53,
         "per_page": 15,
         "current_page": 1,
         "links": {
            "previous": null,
            "next": 1
         }
      }
   }
}
```