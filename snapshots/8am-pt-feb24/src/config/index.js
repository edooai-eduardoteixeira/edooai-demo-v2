import neobank from './neobank.js';

const verticals = {
  neobank,
};

export function getVerticalConfig(verticalName) {
  return verticals[verticalName] || verticals.neobank;
}
