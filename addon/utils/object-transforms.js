import { isPresent as emberIsPresent } from '@ember/utils';

export function compact(objectInstance) {
  const compactedObject = {};

  for (let key in objectInstance) {
    const value = objectInstance[key];

    if (emberIsPresent(value)) {
      compactedObject[key] = value;
    }
  }

  return compactedObject;
}

export function without(originalObj, keysToRemove) {
  let newObj = {};
  const allKeys = Object.keys(originalObj);

  allKeys.forEach((key) => {
    if (keysToRemove.indexOf(key) === -1) {
      newObj[key] = originalObj[key];
    }
  });

  return newObj;
}

export function only(originalObj, keysToRemain) {
  let newObj = {};
  const allKeys = Object.keys(originalObj);

  allKeys.forEach((key) => {
    if (keysToRemain.indexOf(key) !== -1) {
      newObj[key] = originalObj[key];
    }
  });

  return newObj;
}

export function isPresent(objectInstance) {
  const keys = Object.keys(objectInstance);

  return !!keys.length;
}

export default {
  compact,
  without,
  only,
  isPresent,
};
