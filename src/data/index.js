// Picks the data source from config: sample data in the browser, or a real API.
import { createLocalSource } from './sources/local.js';
import { createHttpSource } from './sources/http.js';

export function createDataSource(config) {
  return config.dataSource === 'api' ? createHttpSource(config.api) : createLocalSource();
}
