// Crop the image and return a base64 bytes string of its content
export const resizeAndExport = (img: any): string => {
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 300;
  let width = img.width;
  let height = img.height;
  // Change the resizing logic
  if (width > height) {
    if (width > MAX_WIDTH) {
      height = height * (MAX_WIDTH / width);
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width = width * (MAX_HEIGHT / height);
      height = MAX_HEIGHT;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, width, height);
  // return the .toDataURL of the temp canvas
  const url = canvas.toDataURL();

  return url;
};
