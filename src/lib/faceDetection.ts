export type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function detectFace(image: HTMLImageElement): Promise<FaceBox> {
  await new Promise((resolve) => window.setTimeout(resolve, 250));

  const size = Math.min(image.naturalWidth, image.naturalHeight) * 0.32;

  return {
    x: image.naturalWidth / 2 - size / 2,
    y: image.naturalHeight * 0.26,
    width: size,
    height: size,
  };
}
