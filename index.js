'use strict';

/*jshint esversion: 6 */

const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

/**
 * Exports a plugin to pass into the bookshelf instance, i.e.:
 *
 *      import config from './knexfile';
 *      import knex from 'knex';
 *      import bookshelf from 'bookshelf';
 *
 *      const ORM = bookshelf(knex(config));
 *
 *      ORM.plugin(require('./simplepaginate.plugin'));
 *
 *      export default ORM;
 *
 * The plugin attaches one instance method to the bookshelf
 * Model object: simplePaginate.
 *
 * Model#simplepaginate works like Model#fetchAll, but returns a single page of
 * results instead of all results, as well as the pagination information
 *
 * See methods below for details.
 */
module.exports = function simplePaginationPlugin(bookshelf) {
  const Model = bookshelf.Model;
  /**
   * @method Model#fetchSimplePaginate
   * @belongsTo Model
   *
   * Similar to {@link Model#fetchAll}, but fetches a single page of results
   * as specified by the limit (page size) and offset or page number.
   *
   * Any options that may be passed to {@link Model#fetchAll} may also be passed
   * in the options to this method.
   *
   * To perform pagination, you may include *either* an `page` and `limit`
   *
   * By default, with no parameters or missing parameters, `fetchSimplePaginate` will use an
   * options object of `{page: 1, limit: 10}`
   *
   *
   * Below is an example showing the user of a JOIN query with sort/ordering,
   * pagination, and related models.
   *
   * @example
   *
   * Car
   * .query(function (qb) {
   *    qb.innerJoin('manufacturers', 'cars.manufacturer_id', 'manufacturers.id');
   *    qb.groupBy('cars.id');
   *    qb.where('manufacturers.country', '=', 'Sweden');
   * })
   * .simplepaginate({
   *    limit: 15, // Defaults to 10 if not specified
   *    page: 3, // Defaults to 1 if not specified
   *    withRelated: ['engine'] // Passed to Model#fetchAll
   * })
   * .then(function (results) {
   *    console.log(results); // Paginated results object with metadata example below
   * })
   *
   * // Pagination results:
   *
   * {
   *    models: [<Car>], // Regular bookshelf Collection
   *    // other standard Collection attributes
   *    ...
   *    meta: {
   *      pagination: {
   *        count: 53, // Total number of rows found for the query after pagination
   *        per_page: 15, // The requested number of rows per page
   *        current_page: 3, // The requested page number
   *        links: {
   *          previous: 
   *          next:
   *        }
   *      }
   *    }
   * }
   *
   * @param options {object}
   *    The pagination options, plus any additional options that will be passed to
   *    {@link Model#fetchAll}
   * @returns {Promise<Model|null>}
   */
  function simplePaginate(options = {}) {
    function objectWithoutProperties(obj, keys) {
      var target = {};

      for (var i in obj) {
        if (keys.indexOf(i) >= 0) continue;
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
        target[i] = obj[i];
      }

      return target;
    }

    function ensureIntWithDefault(val, def) {
      if (!val) {
        return def;
      }

      val = parseInt(val);

      if (Number.isNaN(val)) {
        return def;
      }

      return val;
    }

    const {
      page,
      limit,
    } = options;

    const _limit = ensureIntWithDefault(limit, DEFAULT_LIMIT);
    let _page = ensureIntWithDefault(page, DEFAULT_PAGE);

    const fetchMethodName = this instanceof Model ? 'fetchAll' : 'fetch';
    const fetchOptions = objectWithoutProperties(options, ['page', 'limit', 'offset']);

    const paginate = () => {
      return this.clone().query((qb) => {
        qb.limit.apply(qb, [_limit + 1]);
        qb.offset.apply(qb, [(_page - 1) * _limit]);
      })[fetchMethodName](fetchOptions);
    };

    return paginate().then((data) => {
      const hasNextPage = data.length === _limit + 1;

      return {
        data: data.slice(0, _limit),
        meta: {
          pagination: {
            count: hasNextPage ? _limit : data.length,
            per_page: _limit,
            current_page: _page,
            links: {
              previous: _page > 1 ? _page - 1 : null,
              next: hasNextPage ? _page + 1 : null,
            }
          },
        }
      };
    });
  }

  bookshelf.Model.prototype.simplePaginate = simplePaginate;

  bookshelf.Model.simplePaginate = function (...args) {
    return this.forge().simplePaginate(...args);
  };

  bookshelf.Collection.prototype.simplePaginate = simplePaginate;
};