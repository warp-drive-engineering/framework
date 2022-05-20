import Store from '@ember-data/store';

// this file cannot be typed until the @types/ember-data
// is fixed to remove the "injection" of store on routes/controllers
// and also cannot be typed without an override file until
// typescript supports any thenable as the return of an async function.
export default class AppStore extends Store {
  #queries = new Map();

  async query(type, query, options = {}) {
    const adapter = this.adapterFor('application');
    const existingQueryResult = this.#queries.get(type);

    if (existingQueryResult) {
      if (options.reload === true || adapter.shouldReloadQuery(type, query)) {
        await existingQueryResult.update();
      } else if (
        options.backgroundReload === true ||
        adapter.shouldBackgroundReloadQuery(type, query)
      ) {
        void existingQueryResult.update();
      }
      return existingQueryResult;
    }

    const queryResult = await super.query(type, query, options);
    this.#queries.set(type, queryResult);
    return queryResult;
  }
}
