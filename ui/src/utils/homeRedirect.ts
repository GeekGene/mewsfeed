const LOCALSTORAGE_KEY = "redirectToDiscover";

export const setupHomeRedirect = () => {
  const redirectCache = localStorage.getItem(LOCALSTORAGE_KEY);

  if (redirectCache === null) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({ value: true }));
  }
};

export const setHomeRedirect = (value: boolean) => {
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({ value }));
};

export const getHomeRedirect = () => {
  const data = localStorage.getItem(LOCALSTORAGE_KEY);
  return data ? JSON.parse(data).value : undefined;
};
