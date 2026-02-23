import neobank from './neobank.js';

const verticals = {
  neobank,
};

export function getVerticalConfig(verticalName) {
  return verticals[verticalName] || verticals.neobank;
}

export function getVerticalFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('vertical') || 'neobank';
}
