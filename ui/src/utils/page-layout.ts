export const pageHeightCorrection = (offset: number, height: number) => {
  // "offset" is a Number (pixels) that refers to the total
  // height of header + footer that occupies on screen,
  // based on the QLayout "view" prop configuration

  // this is actually what the default style-fn does in Quasar
  // return { minHeight: offset ? `calc(100vh - ${offset}px)` : "100vh" };
  return { minHeight: `${height - offset - 56 - 16}px` };
};
