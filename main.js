const jimp = require("jimp");
const sizeOf = require("image-size");
const path = require("path");
const fs = require("fs-extra");
const cliProgress = require("cli-progress");
const imageBar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);

const getImagePathList = () => {
  const ordersPath = path.resolve(__dirname, "Orders");
  const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
      filelist = fs.statSync(path.join(dir, file)).isDirectory()
        ? walkSync(path.join(dir, file), filelist)
        : filelist.concat(path.join(dir, file));
    });
    return filelist;
  };
  const imageFilePaths = walkSync(ordersPath).filter(function(file) {
    return (
      path.extname(file).toLowerCase() === ".jpeg" ||
      path.extname(file).toLowerCase() === ".jpg"
    );
  });
  return imageFilePaths;
};

const processOrientation = async () => {
  console.log("Processing every image orientation.");
  imageBar.start(getImagePathList().length, 0);
  let imageIndex = 0;
  for (imagePath of getImagePathList()) {
    await checkOrientation(imagePath);
    imageIndex += 1;
    await imageBar.update(imageIndex);
  }
  imageBar.stop();
};

const checkOrientation = async imagePath => {
  const imageDimensions = await fs.readFileSync(imagePath);
  const dimensions = await sizeOf(imageDimensions);
  if (
    dimensions.width >= dimensions.height &&
    (~imagePath.indexOf("Notecard") || ~imagePath.indexOf("Calendar"))
  ) {
    const newPath = imagePath.replace(/(\.[\w\d_-]+)$/i, "_Horizontal$1");
    fs.renameSync(imagePath, newPath);
  }
  if (dimensions.width >= dimensions.height && ~imagePath.indexOf("Postcard")) {
    console.log("rotate");
    const image = await jimp.read(imagePath);
    console.log("Start Rotate");
    image.rotate(90).write(imagePath);
    console.log("Rotated");
    console.log("Finish rotate");
  }
};

processOrientation();
